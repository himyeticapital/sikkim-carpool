import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  fetchAutocomplete,
  fetchPlaceDetails,
  newSessionToken,
  type AutocompletePrediction,
  type SessionToken,
} from '@/services/places';
import { palette } from '@/theme/colors';
import type { PlaceSelection } from '@/types/models';

interface PlacesAutocompleteProps {
  /** Controlled display text (e.g. a previously selected place). */
  value?: string;
  /** Called once the user picks a suggestion and we've resolved coordinates. */
  onSelect: (place: PlaceSelection) => void;
  /** Called on raw text edits — useful to clear a previously selected place. */
  onChangeText?: (text: string) => void;
  placeholder?: string;
  /** Optional label rendered above the field. */
  label?: string;
  /** ms to wait after the last keystroke before querying. */
  debounceMs?: number;
  autoFocus?: boolean;
  /**
   * When provided, an "Use current location" row is offered above
   * suggestions while the field is empty and focused.
   */
  onUseCurrentLocation?: () => void | Promise<void>;
}

/**
 * Reusable Google Places Autocomplete input, used by Home (destination
 * search) and Offer Ride (source + destination).
 *
 * Handles debouncing, request cancellation of stale queries, Places billing
 * session tokens, loading/error states, and resolving the chosen prediction
 * to lat/lng. Shows a "Powered by Google" attribution whenever predictions
 * are visible, per Google Places' terms of service.
 *
 * UI is intentionally large-target / high-contrast — this app is often used
 * in a moving vehicle on mountain roads.
 */
export function PlacesAutocomplete({
  value,
  onSelect,
  onChangeText,
  placeholder = 'Search for a place',
  label,
  debounceMs = 350,
  autoFocus = false,
  onUseCurrentLocation,
}: PlacesAutocompleteProps) {
  const [query, setQuery] = useState(value ?? '');
  const [predictions, setPredictions] = useState<AutocompletePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showList, setShowList] = useState(false);

  // One billing session spans the keystrokes of a single search + its Details
  // lookup. We mint a fresh token after each successful selection.
  const sessionTokenRef = useRef<SessionToken>(newSessionToken());
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Guards against a resolved-but-stale response overwriting a newer selection.
  const suppressNextQueryRef = useRef(false);

  // Keep internal text in sync if the parent controls `value` externally.
  useEffect(() => {
    if (value !== undefined && value !== query) {
      suppressNextQueryRef.current = true;
      setQuery(value);
      setShowList(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const runSearch = useCallback(async (text: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const results = await fetchAutocomplete(
        text,
        sessionTokenRef.current,
        controller.signal,
      );
      if (!controller.signal.aborted) {
        setPredictions(results);
        setShowList(true);
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        setPredictions([]);
        setError(
          err instanceof Error ? err.message : 'Could not load suggestions.',
        );
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  const handleChangeText = useCallback(
    (text: string) => {
      setQuery(text);
      onChangeText?.(text);

      if (suppressNextQueryRef.current) {
        suppressNextQueryRef.current = false;
        return;
      }

      if (debounceRef.current) clearTimeout(debounceRef.current);

      const trimmed = text.trim();
      if (trimmed.length < 2) {
        abortRef.current?.abort();
        setPredictions([]);
        setShowList(Boolean(onUseCurrentLocation) && trimmed.length === 0);
        setLoading(false);
        setError(null);
        return;
      }

      debounceRef.current = setTimeout(() => runSearch(trimmed), debounceMs);
    },
    [debounceMs, onChangeText, onUseCurrentLocation, runSearch],
  );

  const handlePick = useCallback(
    async (prediction: AutocompletePrediction) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();

      suppressNextQueryRef.current = true;
      setQuery(prediction.description);
      setShowList(false);
      setPredictions([]);
      setLoading(true);
      setError(null);

      try {
        const place = await fetchPlaceDetails(
          prediction.placeId,
          sessionTokenRef.current,
        );
        onSelect(place);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Could not load that place.',
        );
      } finally {
        setLoading(false);
        // A selection closes the billing session — start a fresh one.
        sessionTokenRef.current = newSessionToken();
      }
    },
    [onSelect],
  );

  const handleUseCurrentLocation = useCallback(async () => {
    setShowList(false);
    await onUseCurrentLocation?.();
  }, [onUseCurrentLocation]);

  // Clean up any in-flight timer/request on unmount.
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const showCurrentLocationRow =
    showList && Boolean(onUseCurrentLocation) && query.trim().length === 0;
  const showDropdown = showList && (predictions.length > 0 || showCurrentLocationRow);

  return (
    <View className="w-full">
      {label ? (
        <Text className="mb-1 text-base font-semibold text-ink">{label}</Text>
      ) : null}

      <View className="flex-row items-center rounded-2xl border-2 border-brand-light bg-white px-4">
        <TextInput
          className="flex-1 py-4 text-lg text-ink"
          value={query}
          onChangeText={handleChangeText}
          onFocus={() => {
            if (predictions.length > 0 || (onUseCurrentLocation && query.trim().length === 0)) {
              setShowList(true);
            }
          }}
          placeholder={placeholder}
          placeholderTextColor={palette.muted}
          autoFocus={autoFocus}
          autoCorrect={false}
          returnKeyType="search"
        />
        {loading ? <ActivityIndicator color={palette.brand} /> : null}
        {query.length > 0 && !loading ? (
          <Pressable
            hitSlop={12}
            onPress={() => {
              handleChangeText('');
            }}
            accessibilityLabel="Clear search"
          >
            <Text className="px-1 text-xl text-muted">×</Text>
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text className="mt-1 px-1 text-base text-prayer-red">{error}</Text>
      ) : null}

      {showDropdown ? (
        <View className="mt-2 overflow-hidden rounded-2xl border border-brand-light bg-white">
          {showCurrentLocationRow ? (
            <Pressable
              onPress={handleUseCurrentLocation}
              android_ripple={{ color: palette.brandLight }}
              className="flex-row items-center gap-2 px-4 py-4 active:bg-brand-light"
            >
              <Text className="text-lg">📍</Text>
              <Text className="font-heading text-lg text-brand-dark">
                Use current location
              </Text>
            </Pressable>
          ) : null}

          {predictions.map((p, index) => (
            <Pressable
              key={p.placeId}
              onPress={() => handlePick(p)}
              android_ripple={{ color: palette.brandLight }}
              className={`px-4 py-4 active:bg-brand-light ${
                index > 0 || showCurrentLocationRow ? 'border-t border-brand-light' : ''
              }`}
            >
              <Text className="text-lg font-medium text-ink" numberOfLines={1}>
                {p.primaryText}
              </Text>
              {p.secondaryText ? (
                <Text className="text-base text-muted" numberOfLines={1}>
                  {p.secondaryText}
                </Text>
              ) : null}
            </Pressable>
          ))}

          {predictions.length > 0 ? (
            <View className="items-center border-t border-brand-light bg-cream py-2">
              <Text className="text-xs text-muted">Powered by Google</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export default PlacesAutocomplete;

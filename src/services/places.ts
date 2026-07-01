import { env } from '@/config/env';
import type { PlaceSelection } from '@/types/models';

/**
 * Thin wrapper over the Google Places (legacy) web service.
 *
 * We use the legacy Autocomplete + Details endpoints because they are the
 * simplest to call with a plain API key and are sufficient for the MVP. A
 * per-search "session token" groups autocomplete keystrokes with the final
 * Details lookup into one billable session — important for cost control given
 * how many keystrokes a query generates.
 *
 * Biased to Sikkim / North-East India via a location + radius so suggestions
 * favour the region the app actually serves.
 */

const BASE = 'https://maps.googleapis.com/maps/api/place';

// Rough centre of Sikkim (Gangtok) — biases (does not restrict) suggestions.
const REGION_BIAS = { lat: 27.3314, lng: 88.6138, radiusMeters: 150_000 };

export interface AutocompletePrediction {
  placeId: string;
  primaryText: string;
  secondaryText: string;
  description: string;
}

/** Opaque token grouping one autocomplete "session" for billing. */
export type SessionToken = string;

/**
 * Generate a session token. Reanimated/crypto-free: React Native lacks
 * crypto.randomUUID in all engines, so we build a sufficiently-unique token
 * from time + randomness. Uniqueness only needs to hold within a single search.
 */
export function newSessionToken(): SessionToken {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function fetchAutocomplete(
  input: string,
  sessionToken: SessionToken,
  signal?: AbortSignal,
): Promise<AutocompletePrediction[]> {
  const key = env.googleMapsApiKey;
  if (!key || input.trim().length < 2) return [];

  const params = new URLSearchParams({
    input,
    key,
    sessiontoken: sessionToken,
    components: 'country:in',
    location: `${REGION_BIAS.lat},${REGION_BIAS.lng}`,
    radius: String(REGION_BIAS.radiusMeters),
  });

  const res = await fetch(`${BASE}/autocomplete/json?${params.toString()}`, {
    signal,
  });
  if (!res.ok) {
    throw new Error(`Places autocomplete failed: HTTP ${res.status}`);
  }
  const json = (await res.json()) as {
    status: string;
    error_message?: string;
    predictions?: Array<{
      place_id: string;
      description: string;
      structured_formatting?: {
        main_text?: string;
        secondary_text?: string;
      };
    }>;
  };

  // ZERO_RESULTS is a normal, empty outcome — not an error.
  if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
    throw new Error(
      `Places autocomplete: ${json.status}${
        json.error_message ? ` — ${json.error_message}` : ''
      }`,
    );
  }

  return (json.predictions ?? []).map((p) => ({
    placeId: p.place_id,
    description: p.description,
    primaryText: p.structured_formatting?.main_text ?? p.description,
    secondaryText: p.structured_formatting?.secondary_text ?? '',
  }));
}

/**
 * Resolve a prediction to coordinates. Closes out the billing session that the
 * autocomplete keystrokes started (pass the SAME sessionToken).
 */
export async function fetchPlaceDetails(
  placeId: string,
  sessionToken: SessionToken,
  signal?: AbortSignal,
): Promise<PlaceSelection> {
  const key = env.googleMapsApiKey;
  if (!key) {
    throw new Error('Google Maps API key is not configured.');
  }

  const params = new URLSearchParams({
    place_id: placeId,
    key,
    sessiontoken: sessionToken,
    fields: 'place_id,formatted_address,name,geometry',
  });

  const res = await fetch(`${BASE}/details/json?${params.toString()}`, {
    signal,
  });
  if (!res.ok) {
    throw new Error(`Place details failed: HTTP ${res.status}`);
  }
  const json = (await res.json()) as {
    status: string;
    error_message?: string;
    result?: {
      place_id: string;
      name?: string;
      formatted_address?: string;
      geometry?: { location?: { lat: number; lng: number } };
    };
  };

  if (json.status !== 'OK' || !json.result?.geometry?.location) {
    throw new Error(
      `Place details: ${json.status}${
        json.error_message ? ` — ${json.error_message}` : ''
      }`,
    );
  }

  const { location } = json.result.geometry;
  return {
    placeId: json.result.place_id,
    description:
      json.result.formatted_address ?? json.result.name ?? 'Selected place',
    lat: location.lat,
    lng: location.lng,
  };
}

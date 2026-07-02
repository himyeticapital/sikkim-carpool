import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Haptics vocabulary — three verbs, used consistently:
 * tap = any press acknowledged · success = something completed ·
 * warning = a destructive step or failure. Native-only; web stays silent
 * (browser vibration is loud and patchy). All fire-and-forget.
 */
const native = Platform.OS !== 'web';

export function tapHaptic(): void {
  if (native) Haptics.selectionAsync().catch(() => {});
}

export function successHaptic(): void {
  if (native) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }
}

export function warningHaptic(): void {
  if (native) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  }
}

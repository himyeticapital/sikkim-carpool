import { Alert } from 'react-native';

interface ConfirmActionOptions {
  title: string;
  message: string;
  /** Label on the button that performs the action. */
  confirmLabel: string;
  /** Defaults to 'Go back'. */
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
}

/**
 * The app's one confirmation-dialog shape: a cancel button and a single
 * action button. Every mutating action that deserves a second thought
 * (cancel a booking, ban a user, …) goes through here.
 */
export function confirmAction({
  title,
  message,
  confirmLabel,
  cancelLabel = 'Go back',
  destructive = false,
  onConfirm,
}: ConfirmActionOptions): void {
  Alert.alert(title, message, [
    { text: cancelLabel, style: 'cancel' },
    {
      text: confirmLabel,
      style: destructive ? 'destructive' : 'default',
      onPress: onConfirm,
    },
  ]);
}

import { Alert } from 'react-native';

import { confirmAction } from './confirm';
import * as haptics from './haptics';

describe('confirmAction', () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  const warningHaptic = jest.spyOn(haptics, 'warningHaptic').mockImplementation(() => undefined);

  afterEach(() => {
    alert.mockClear();
    warningHaptic.mockClear();
  });

  it('fires a warning haptic for destructive actions', () => {
    confirmAction({
      title: 'Cancel this ride?',
      message: 'This cannot be undone.',
      confirmLabel: 'Cancel ride',
      destructive: true,
      onConfirm: jest.fn(),
    });
    expect(warningHaptic).toHaveBeenCalledTimes(1);
  });

  it('does not fire a haptic for non-destructive actions', () => {
    confirmAction({
      title: 'Mark completed?',
      message: 'Riders will be notified.',
      confirmLabel: 'Mark completed',
      onConfirm: jest.fn(),
    });
    expect(warningHaptic).not.toHaveBeenCalled();
  });

  it('builds a cancel + single action button pair, styled by destructiveness', () => {
    const onConfirm = jest.fn();
    confirmAction({
      title: 'Ban this user?',
      message: 'They will be signed out immediately.',
      confirmLabel: 'Ban user',
      destructive: true,
      onConfirm,
    });

    expect(alert).toHaveBeenCalledWith('Ban this user?', 'They will be signed out immediately.', [
      { text: 'Go back', style: 'cancel' },
      { text: 'Ban user', style: 'destructive', onPress: onConfirm },
    ]);
  });

  it('defaults the cancel label and uses the default button style', () => {
    const onConfirm = jest.fn();
    confirmAction({
      title: 'Mark completed?',
      message: 'Riders will be notified.',
      confirmLabel: 'Mark completed',
      onConfirm,
    });

    expect(alert).toHaveBeenCalledWith('Mark completed?', 'Riders will be notified.', [
      { text: 'Go back', style: 'cancel' },
      { text: 'Mark completed', style: 'default', onPress: onConfirm },
    ]);
  });
});

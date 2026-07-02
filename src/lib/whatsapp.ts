import { Linking } from 'react-native';

/**
 * Opens a WhatsApp chat with a phone number as stored in `profiles`
 * (E.164, with or without the leading '+' — wa.me wants it without).
 */
export function openWhatsAppChat(phoneNumber: string): void {
  Linking.openURL(`https://wa.me/${phoneNumber.replace('+', '')}`);
}

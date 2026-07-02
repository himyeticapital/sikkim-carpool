import { Linking } from 'react-native';

import { openWhatsAppChat } from './whatsapp';

describe('openWhatsAppChat', () => {
  const openURL = jest.spyOn(Linking, 'openURL').mockImplementation(() => Promise.resolve());

  afterEach(() => {
    openURL.mockClear();
  });

  it('strips the leading + for wa.me', () => {
    openWhatsAppChat('+919999900001');
    expect(openURL).toHaveBeenCalledWith('https://wa.me/919999900001');
  });

  it('passes numbers without a leading + through unchanged', () => {
    openWhatsAppChat('919999900001');
    expect(openURL).toHaveBeenCalledWith('https://wa.me/919999900001');
  });
});

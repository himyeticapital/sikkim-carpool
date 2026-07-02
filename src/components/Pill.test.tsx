import { render, screen } from '@testing-library/react-native';

import { Pill } from './Pill';

describe('Pill', () => {
  it('renders its label', async () => {
    await render(<Pill label="Confirmed" tone="positive" />);
    expect(screen.getByText('Confirmed')).toBeTruthy();
  });

  it.each(['positive', 'neutral', 'warning', 'danger'] as const)(
    'renders without crashing for the %s tone',
    async (tone) => {
      await render(<Pill label="Status" tone={tone} />);
      expect(screen.getByText('Status')).toBeTruthy();
    },
  );
});

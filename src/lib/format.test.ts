import { formatShortDate, isToday, localDayBounds, toLocalDateKey } from './format';

describe('toLocalDateKey', () => {
  it('pads single-digit month and day', () => {
    expect(toLocalDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('uses local calendar fields, not UTC', () => {
    // 2026-07-02 23:30 local — a UTC-based formatter would roll this to the 3rd.
    const date = new Date(2026, 6, 2, 23, 30);
    expect(toLocalDateKey(date)).toBe('2026-07-02');
  });
});

describe('localDayBounds', () => {
  it('spans exactly 24 hours', () => {
    const { start, end } = localDayBounds('2026-07-02');
    expect(end.getTime() - start.getTime()).toBe(24 * 60 * 60 * 1000);
  });

  it('starts at local midnight of the given date, not UTC midnight', () => {
    const { start } = localDayBounds('2026-07-02');
    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(6);
    expect(start.getDate()).toBe(2);
    expect(start.getHours()).toBe(0);
  });

  it('rolls the end bound into the next calendar day', () => {
    const { end } = localDayBounds('2026-07-02');
    expect(end.getDate()).toBe(3);
  });
});

describe('isToday', () => {
  it('is true for the current moment', () => {
    expect(isToday(new Date())).toBe(true);
  });

  it('is false for a date in the past', () => {
    expect(isToday(new Date(2020, 0, 1))).toBe(false);
  });
});

describe('formatShortDate', () => {
  it('includes the day number and month', () => {
    const formatted = formatShortDate(new Date(2026, 0, 5));
    expect(formatted).toContain('5');
    expect(formatted.toLowerCase()).toContain('jan');
  });
});

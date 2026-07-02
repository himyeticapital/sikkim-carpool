import { avatarColorFor, initialsFor } from './avatar';

describe('initialsFor', () => {
  it('takes the first letter of the first two words', () => {
    expect(initialsFor('Pemba Sherpa')).toBe('PS');
  });

  it('uppercases lowercase input', () => {
    expect(initialsFor('pemba sherpa')).toBe('PS');
  });

  it('handles a single name', () => {
    expect(initialsFor('Tenzin')).toBe('T');
  });

  it('collapses repeated whitespace', () => {
    expect(initialsFor('  Pemba   Sherpa  ')).toBe('PS');
  });

  it('falls back to ? for empty input', () => {
    expect(initialsFor('')).toBe('?');
    expect(initialsFor('   ')).toBe('?');
  });
});

describe('avatarColorFor', () => {
  it('is deterministic for the same name', () => {
    expect(avatarColorFor('Pemba Sherpa')).toBe(avatarColorFor('Pemba Sherpa'));
  });

  it('returns a hex color string', () => {
    expect(avatarColorFor('Pemba Sherpa')).toMatch(/^#/);
  });
});

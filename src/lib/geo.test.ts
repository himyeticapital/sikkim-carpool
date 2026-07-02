import { haversineKm } from './geo';

describe('haversineKm', () => {
  it('is zero for identical points', () => {
    expect(haversineKm({ lat: 27.33, lng: 88.61 }, { lat: 27.33, lng: 88.61 })).toBe(0);
  });

  it('matches the known ~111.2km for one degree of latitude', () => {
    const km = haversineKm({ lat: 0, lng: 0 }, { lat: 1, lng: 0 });
    expect(km).toBeCloseTo(111.2, 0);
  });

  it('is symmetric', () => {
    const a = { lat: 27.3389, lng: 88.6065 };
    const b = { lat: 26.7271, lng: 88.3953 };
    expect(haversineKm(a, b)).toBeCloseTo(haversineKm(b, a), 6);
  });
});

import { staggerDelay } from './motion';

describe('staggerDelay', () => {
  it('is zero for the first item', () => {
    expect(staggerDelay(0)).toBe(0);
  });

  it('steps by the default 55ms', () => {
    expect(staggerDelay(1)).toBe(55);
    expect(staggerDelay(3)).toBe(165);
  });

  it('caps at the default max of 440ms so long lists stop crawling', () => {
    expect(staggerDelay(20)).toBe(440);
  });

  it('honors a custom step and max', () => {
    expect(staggerDelay(2, 100, 1000)).toBe(200);
    expect(staggerDelay(50, 100, 1000)).toBe(1000);
  });
});

import { describe, expect, it, vi } from 'vitest';
import { memoize } from '../src/logic/memoize.js';

describe('memoize', () => {
  it('calls the underlying function only once per unique args', () => {
    const spy = vi.fn((a: number, b: number) => a + b);
    const memoized = memoize(spy);
    memoized(1, 2);
    memoized(1, 2);
    memoized(2, 3);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('returns the same result as the underlying function', () => {
    const memoized = memoize((a: number) => a * 2);
    expect(memoized(5)).toBe(10);
    expect(memoized(5)).toBe(10);
  });
});

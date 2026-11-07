import { describe, expect, it } from 'vitest';
import { countPossibleSecrets } from '../src/logic/countPossibleSecrets.js';

describe('countPossibleSecrets', () => {
  it('returns 1 for length 0', () => {
    expect(countPossibleSecrets(0, 10)).toBe(1);
  });

  it('returns base for length 1', () => {
    expect(countPossibleSecrets(1, 2)).toBe(2);
    expect(countPossibleSecrets(1, 10)).toBe(10);
    expect(countPossibleSecrets(1, 16)).toBe(16);
  });

  it('returns P(base, length)', () => {
    expect(countPossibleSecrets(2, 10)).toBe(90);
    expect(countPossibleSecrets(3, 10)).toBe(720);
    expect(countPossibleSecrets(4, 16)).toBe(16 * 15 * 14 * 13);
  });

  it('returns 0 when length > base', () => {
    expect(countPossibleSecrets(5, 2)).toBe(0);
  });

  it('is stable across repeated calls (memoized)', () => {
    expect(countPossibleSecrets(4, 10)).toBe(countPossibleSecrets(4, 10));
  });
});

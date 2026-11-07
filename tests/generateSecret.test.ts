import { describe, expect, it } from 'vitest';
import { generateSecret } from '../src/logic/generateSecret.js';

const sequence =
  (...values: number[]) =>
  () => {
    let i = 0;
    return values[i++ % values.length];
  };

describe('generateSecret', () => {
  it('returns a string of requested length', () => {
    const result = generateSecret(3, 10, sequence(0, 0, 0));
    expect(result).toHaveLength(3);
  });

  it('returns unique digits', () => {
    const result = generateSecret(6, 10, () => 0.5);
    const chars = result.split('');
    expect(new Set(chars).size).toBe(chars.length);
  });

  it('only uses digits allowed for base 2', () => {
    const result = generateSecret(2, 2, () => 0.5);
    result.split('').forEach((c) => expect(['0', '1']).toContain(c));
  });

  it('produces a known result for a known random sequence', () => {
    expect(generateSecret(2, 10, sequence(0, 0))).toBe('01');
  });

  it('can produce a secret that starts with 0', () => {
    const result = generateSecret(2, 10, sequence(0, 0));
    expect(result[0]).toBe('0');
  });

  it('throws when length > base', () => {
    expect(() => generateSecret(5, 2, () => 0.5)).toThrow();
  });

  it('throws when length < 1', () => {
    expect(() => generateSecret(0, 10, () => 0.5)).toThrow();
  });
});

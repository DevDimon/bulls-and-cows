import { describe, expect, it } from 'vitest';
import { createDigitValidator } from '../src/logic/createDigitValidator.js';

describe('createDigitValidator', () => {
  it('accepts digits valid for base 2', () => {
    const v = createDigitValidator(2);
    expect(v('0')).toBe(true);
    expect(v('1')).toBe(true);
    expect(v('2')).toBe(false);
    expect(v('a')).toBe(false);
  });

  it('accepts digits valid for base 10', () => {
    const v = createDigitValidator(10);
    expect(v('0')).toBe(true);
    expect(v('9')).toBe(true);
    expect(v('a')).toBe(false);
  });

  it('accepts hex digits case-insensitively', () => {
    const v = createDigitValidator(16);
    expect(v('a')).toBe(true);
    expect(v('A')).toBe(true);
    expect(v('f')).toBe(true);
    expect(v('F')).toBe(true);
    expect(v('g')).toBe(false);
  });

  it('rejects multi-char and empty strings', () => {
    const v = createDigitValidator(10);
    expect(v('12')).toBe(false);
    expect(v('')).toBe(false);
  });
});

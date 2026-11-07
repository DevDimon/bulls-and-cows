import { describe, expect, it } from 'vitest';
import { isValidGuess } from '../src/logic/isValidGuess.js';

describe('isValidGuess', () => {
  it('accepts valid guesses', () => {
    expect(isValidGuess('0123', 4, 10)).toBe(true);
    expect(isValidGuess('ab12', 4, 16)).toBe(true);
    expect(isValidGuess('AB12', 4, 16)).toBe(true);
    expect(isValidGuess('01', 2, 2)).toBe(true);
  });

  it('rejects wrong length', () => {
    expect(isValidGuess('012', 4, 10)).toBe(false);
    expect(isValidGuess('01234', 4, 10)).toBe(false);
  });

  it('rejects digits invalid for the base', () => {
    expect(isValidGuess('2', 1, 2)).toBe(false);
    expect(isValidGuess('a', 1, 10)).toBe(false);
    expect(isValidGuess('8', 1, 8)).toBe(false);
  });

  it('rejects duplicates', () => {
    expect(isValidGuess('1122', 4, 10)).toBe(false);
    expect(isValidGuess('aa12', 4, 16)).toBe(false);
    expect(isValidGuess('Aa12', 4, 16)).toBe(false);
  });
});

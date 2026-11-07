import { describe, expect, it } from 'vitest';
import { evaluateGuess } from '../src/logic/evaluateGuess.js';

describe('evaluateGuess', () => {
  it('returns 0 bulls and 0 cows when nothing matches', () => {
    expect(evaluateGuess('1234', '5678')).toEqual({ bulls: 0, cows: 0 });
  });

  it('returns all bulls on exact match', () => {
    expect(evaluateGuess('1234', '1234')).toEqual({ bulls: 4, cows: 0 });
  });

  it('returns all cows on permutation', () => {
    expect(evaluateGuess('1234', '4321')).toEqual({ bulls: 0, cows: 4 });
  });

  it('returns mixed bulls and cows', () => {
    expect(evaluateGuess('1234', '1325')).toEqual({ bulls: 1, cows: 2 });
  });

  it('handles hex case-insensitively', () => {
    expect(evaluateGuess('a1b2', 'A1B2')).toEqual({ bulls: 4, cows: 0 });
    expect(evaluateGuess('a1b2', 'A1C3')).toEqual({ bulls: 2, cows: 0 });
  });

  it('handles leading zeros', () => {
    expect(evaluateGuess('0123', '0123')).toEqual({ bulls: 4, cows: 0 });
    expect(evaluateGuess('0123', '3210')).toEqual({ bulls: 0, cows: 4 });
  });
});

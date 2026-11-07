import { describe, expect, it } from 'vitest';
import { applyGuess, createGameState } from '../src/logic/gameState.js';

const fixedRandom = () => 0;

describe('createGameState', () => {
  it('creates a playing state with empty history', () => {
    const state = createGameState(2, 10, fixedRandom, 1000);
    expect(state.status).toBe('playing');
    expect(state.history).toEqual([]);
    expect(state.startTime).toBe(1000);
    expect(state.secret).toHaveLength(2);
  });
});

describe('applyGuess', () => {
  const base = createGameState(2, 10, fixedRandom, 1000);

  it('appends a new attempt immutably', () => {
    const next = applyGuess(base, '34', 2000);
    expect(next).not.toBe(base);
    expect(base.history).toEqual([]);
    expect(next.history).toHaveLength(1);
    expect(next.history[0].guess).toBe('34');
  });

  it('ignores invalid guesses', () => {
    const next = applyGuess(base, 'xx', 2000);
    expect(next).toBe(base);
  });

  it('ignores duplicate guesses', () => {
    const once = applyGuess(base, '34', 2000);
    const twice = applyGuess(once, '34', 3000);
    expect(twice).toBe(once);
  });

  it('wins when bulls equal length', () => {
    const state = createGameState(2, 10, fixedRandom, 1000);
    const won = applyGuess(state, state.secret, 2000);
    expect(won.status).toBe('won');
    expect(won.endTime).toBe(2000);
  });

  it('ignores guesses after game is won', () => {
    const state = createGameState(2, 10, fixedRandom, 1000);
    const won = applyGuess(state, state.secret, 2000);
    const later = applyGuess(won, '34', 3000);
    expect(later).toBe(won);
  });
});

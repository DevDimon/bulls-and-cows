import { evaluateGuess } from './evaluateGuess.js';
import { generateSecret } from './generateSecret.js';
import { isValidGuess } from './isValidGuess.js';

export interface Attempt {
  readonly guess: string;
  readonly bulls: number;
  readonly cows: number;
}

export type GameStatus = 'playing' | 'won';

export interface GameState {
  readonly secret: string;
  readonly length: number;
  readonly base: number;
  readonly history: readonly Attempt[];
  readonly status: GameStatus;
  readonly startTime: number;
  readonly endTime?: number;
}

export const createGameState = (
  length: number,
  base: number,
  random?: () => number,
  now: number = Date.now(),
): GameState => ({
  secret: generateSecret(length, base, random),
  length,
  base,
  history: [],
  status: 'playing',
  startTime: now,
});

export const applyGuess = (
  state: GameState,
  guess: string,
  now: number = Date.now(),
): GameState => {
  if (state.status !== 'playing') {
    return state;
  }
  if (!isValidGuess(guess, state.length, state.base)) {
    return state;
  }

  const normalized = guess.toLowerCase();
  const alreadyTried = state.history.some((a) => a.guess === normalized);
  if (alreadyTried) {
    return state;
  }

  const { bulls, cows } = evaluateGuess(state.secret, normalized);
  const attempt: Attempt = { guess: normalized, bulls, cows };
  const newHistory = [...state.history, attempt];
  const won = bulls === state.length;

  return {
    ...state,
    history: newHistory,
    status: won ? 'won' : 'playing',
    endTime: won ? now : undefined,
  };
};

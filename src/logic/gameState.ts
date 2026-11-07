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
): GameState => {
  throw new Error('Not implemented');
};

export const applyGuess = (
  state: GameState,
  guess: string,
  now: number = Date.now(),
): GameState => {
  throw new Error('Not implemented');
};

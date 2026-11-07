export interface Feedback {
  readonly bulls: number;
  readonly cows: number;
}

export const evaluateGuess = (secret: string, guess: string): Feedback => {
  throw new Error('Not implemented');
};

export interface Feedback {
  readonly bulls: number;
  readonly cows: number;
}

export const evaluateGuess = (secret: string, guess: string): Feedback => {
  const s = secret.toLowerCase();
  const g = guess.toLowerCase();

  const bulls = g.split('').reduce((count, char, i) => count + (char === s[i] ? 1 : 0), 0);

  const cows = g
    .split('')
    .reduce((count, char, i) => count + (char !== s[i] && s.includes(char) ? 1 : 0), 0);

  return { bulls, cows };
};

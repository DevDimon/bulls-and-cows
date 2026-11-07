import { memoize } from './memoize.js';

const rawCountPossibleSecrets = (length: number, base: number): number => {
  if (length === 0) {
    return 1;
  }
  if (length < 0 || base < 0 || base < length) {
    return 0;
  }
  return base * countPossibleSecrets(length - 1, base - 1);
};

export const countPossibleSecrets = memoize(rawCountPossibleSecrets);

import { createDigitValidator } from './createDigitValidator.js';
export const isValidGuess = (guess, length, base) => {
    if (guess.length !== length) {
        return false;
    }
    const validator = createDigitValidator(base);
    const chars = guess.toLowerCase().split('');
    if (!chars.every(validator)) {
        return false;
    }
    return new Set(chars).size === chars.length;
};

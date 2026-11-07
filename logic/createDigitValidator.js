import { DIGITS } from './digits.js';
export const createDigitValidator = (base) => (char) => {
    if (typeof char !== 'string' || char.length !== 1) {
        return false;
    }
    const allowed = DIGITS.slice(0, base);
    return allowed.includes(char.toLowerCase());
};

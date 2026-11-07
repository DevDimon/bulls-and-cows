import { DIGITS } from './digits.js';
export const generateSecret = (length, base, random = Math.random) => {
    if (!Number.isInteger(length) || length < 1) {
        throw new Error('length must be a positive integer');
    }
    if (!Number.isInteger(base) || base < 2) {
        throw new Error('base must be an integer >= 2');
    }
    if (length > base) {
        throw new Error(`length (${length}) cannot exceed base (${base})`);
    }
    const pool = DIGITS.slice(0, base).split('');
    const shuffled = pool.reduce((acc, _, i) => {
        if (i >= length) {
            return acc;
        }
        const j = i + Math.floor(random() * (acc.length - i));
        const next = [...acc];
        [next[i], next[j]] = [next[j], next[i]];
        return next;
    }, pool);
    return shuffled.slice(0, length).join('');
};

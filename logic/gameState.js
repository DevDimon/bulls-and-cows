import { evaluateGuess } from './evaluateGuess.js';
import { generateSecret } from './generateSecret.js';
import { isValidGuess } from './isValidGuess.js';
export const createGameState = (length, base, random, now = Date.now()) => ({
    secret: generateSecret(length, base, random),
    length,
    base,
    history: [],
    status: 'playing',
    startTime: now,
});
export const applyGuess = (state, guess, now = Date.now()) => {
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
    const attempt = { guess: normalized, bulls, cows };
    const newHistory = [...state.history, attempt];
    const won = bulls === state.length;
    return {
        ...state,
        history: newHistory,
        status: won ? 'won' : 'playing',
        endTime: won ? now : undefined,
    };
};

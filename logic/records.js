const STORAGE_KEY = 'bulls-and-cows-records';
const MAX_RECORDS = 10;
export const loadRecords = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    }
    catch {
        return [];
    }
};
export const saveRecord = (entry) => {
    const updated = [...loadRecords(), entry]
        .sort((a, b) => (a.attempts !== b.attempts ? a.attempts - b.attempts : a.timeMs - b.timeMs))
        .slice(0, MAX_RECORDS);
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
    catch { }
    return updated;
};

export interface RecordEntry {
  readonly length: number;
  readonly base: number;
  readonly attempts: number;
  readonly timeMs: number;
  readonly date: string;
}

const STORAGE_KEY = 'bulls-and-cows-records';
const MAX_RECORDS = 10;

export const loadRecords = (): RecordEntry[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RecordEntry[]) : [];
  } catch {
    return [];
  }
};

export const saveRecord = (entry: RecordEntry): RecordEntry[] => {
  const updated = [...loadRecords(), entry]
    .sort((a, b) => (a.attempts !== b.attempts ? a.attempts - b.attempts : a.timeMs - b.timeMs))
    .slice(0, MAX_RECORDS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
  return updated;
};

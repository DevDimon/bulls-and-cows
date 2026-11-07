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
  throw new Error('Not implemented');
};

export const saveRecord = (entry: RecordEntry): RecordEntry[] => {
  throw new Error('Not implemented');
};

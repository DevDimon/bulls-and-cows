// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { loadRecords, saveRecord, type RecordEntry } from '../src/logic/records.js';

const makeEntry = (overrides: Partial<RecordEntry> = {}): RecordEntry => ({
  length: 4,
  base: 10,
  attempts: 5,
  timeMs: 30_000,
  date: new Date(0).toISOString(),
  ...overrides,
});

describe('records', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns an empty array initially', () => {
    expect(loadRecords()).toEqual([]);
  });

  it('persists a record', () => {
    saveRecord(makeEntry());
    const loaded = loadRecords();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].attempts).toBe(5);
  });

  it('sorts by attempts, then time', () => {
    saveRecord(makeEntry({ attempts: 10, timeMs: 1000 }));
    saveRecord(makeEntry({ attempts: 5, timeMs: 2000 }));
    saveRecord(makeEntry({ attempts: 5, timeMs: 1000 }));
    const loaded = loadRecords();
    expect(loaded.map((r) => [r.attempts, r.timeMs])).toEqual([
      [5, 1000],
      [5, 2000],
      [10, 1000],
    ]);
  });

  it('keeps at most 10 entries', () => {
    for (let i = 0; i < 15; i++) {
      saveRecord(makeEntry({ attempts: 100 - i }));
    }
    expect(loadRecords()).toHaveLength(10);
  });
});

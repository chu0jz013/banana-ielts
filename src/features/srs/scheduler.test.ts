import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '../../data/db';
import { gradeCard, Rating } from './scheduler';
import { deriveState } from './stateDerive';

beforeEach(async () => {
  await db.reviews.clear();
  await db.logs.clear();
});

describe('SRS scheduler', () => {
  it('creates a review record on first grade', async () => {
    const rec = await gradeCard('w1', Rating.Good);
    expect(rec.wordId).toBe('w1');
    expect(rec.reps).toBeGreaterThan(0);
    expect(rec.nextReview).toBeGreaterThan(Date.now());
  });

  it('Easy grade pushes nextReview further than Again', async () => {
    const easy = await gradeCard('w-easy', Rating.Easy);
    await db.reviews.clear();
    const again = await gradeCard('w-again', Rating.Again);
    expect(easy.nextReview - Date.now()).toBeGreaterThan(again.nextReview - Date.now());
  });

  it('logs a grade interaction', async () => {
    await gradeCard('w-log', Rating.Good);
    const logs = await db.logs.where('wordId').equals('w-log').toArray();
    expect(logs.length).toBe(1);
    expect(logs[0].action).toBe('grade');
    expect(logs[0].grade).toBe(Rating.Good);
  });
});

describe('deriveState', () => {
  it('returns "new" for missing review', () => {
    expect(deriveState(undefined)).toBe('new');
  });

  it('maps stability bands correctly', () => {
    const base = {
      wordId: 'x',
      difficulty: 5,
      reps: 1,
      lapses: 0,
      state: 0,
      lastReview: 0,
      nextReview: 0,
    };
    expect(deriveState({ ...base, stability: 1 })).toBe('learning');
    expect(deriveState({ ...base, stability: 14 })).toBe('familiar');
    expect(deriveState({ ...base, stability: 60 })).toBe('known');
    expect(deriveState({ ...base, stability: 100 })).toBe('mastered');
  });
});

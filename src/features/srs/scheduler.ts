import { fsrs, generatorParameters, createEmptyCard, Rating, type Card, type Grade } from 'ts-fsrs';
import { db, type ReviewRecord } from '../../data/db';

const scheduler = fsrs(generatorParameters({ enable_fuzz: true }));

const recordToCard = (rec: ReviewRecord): Card => ({
  due: new Date(rec.nextReview),
  stability: rec.stability,
  difficulty: rec.difficulty,
  elapsed_days: 0,
  scheduled_days: 0,
  learning_steps: 0,
  reps: rec.reps,
  lapses: rec.lapses,
  state: rec.state,
  last_review: rec.lastReview > 0 ? new Date(rec.lastReview) : undefined,
});

const cardToRecord = (wordId: string, card: Card): ReviewRecord => ({
  wordId,
  difficulty: card.difficulty,
  stability: card.stability,
  reps: card.reps,
  lapses: card.lapses,
  state: card.state,
  lastReview: card.last_review ? card.last_review.getTime() : Date.now(),
  nextReview: card.due.getTime(),
});

export const gradeCard = async (wordId: string, grade: Grade): Promise<ReviewRecord> => {
  const now = new Date();
  const existing = await db.reviews.get(wordId);
  const card = existing ? recordToCard(existing) : createEmptyCard(now);
  const result = scheduler.next(card, now, grade);
  const next = cardToRecord(wordId, result.card);
  await db.reviews.put(next);
  await db.logs.add({
    wordId,
    ts: now.getTime(),
    action: 'grade',
    grade: grade as 1 | 2 | 3 | 4,
  });
  return next;
};

export const previewIntervals = async (wordId: string) => {
  const now = new Date();
  const existing = await db.reviews.get(wordId);
  const card = existing ? recordToCard(existing) : createEmptyCard(now);
  return scheduler.repeat(card, now);
};

export { Rating };

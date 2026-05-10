import Dexie, { type Table } from 'dexie';

export interface WordRecord {
  id: string;
  word: string;
  category: string;
  type: string;
  ipa: string;
  def_en: string;
  def_vi: string;
  example: string;
  synonyms: string[];
  band: number;
}

export interface ReviewRecord {
  wordId: string;
  difficulty: number;
  stability: number;
  reps: number;
  lapses: number;
  state: number;
  lastReview: number;
  nextReview: number;
}

export interface InteractionLog {
  id?: number;
  wordId: string;
  ts: number;
  action: 'view' | 'reveal' | 'audio_replay' | 'grade' | 'bookmark';
  grade?: 1 | 2 | 3 | 4;
  dwellMs?: number;
}

export interface BookmarkRecord {
  wordId: string;
  ts: number;
}

class IELTSDb extends Dexie {
  words!: Table<WordRecord, string>;
  reviews!: Table<ReviewRecord, string>;
  logs!: Table<InteractionLog, number>;
  bookmarks!: Table<BookmarkRecord, string>;

  constructor() {
    super('ielts-feed');
    this.version(1).stores({
      words: 'id, category, band',
      reviews: 'wordId, nextReview, state',
      logs: '++id, wordId, ts',
      bookmarks: 'wordId, ts',
    });
  }
}

export const db = new IELTSDb();

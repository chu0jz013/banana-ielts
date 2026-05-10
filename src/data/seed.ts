import { db, type WordRecord } from './db';
import { isWordEntry } from '../lib/isWordEntry';
import { hashId } from '../lib/hash';
import type { WordDeckJson, WordEntry } from '../types';

const wordModules = import.meta.glob<WordDeckJson>('./words/*.json', {
  eager: true,
  import: 'default',
});

const fileNameFromPath = (path: string) =>
  path.split('/').pop()?.replace(/\.json$/i, '') ?? 'deck';

const titleFromValue = (value: string) =>
  value
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export interface CategoryInfo {
  id: string;
  title: string;
  description: string;
  bandRange: string;
  count: number;
}

export const getCategoryInfos = (): CategoryInfo[] =>
  Object.entries(wordModules)
    .map(([path, deck]) => {
      const id = fileNameFromPath(path);
      const entries = Array.isArray(deck.entries) ? deck.entries.filter(isWordEntry) : [];
      return {
        id,
        title: titleFromValue(deck.category?.trim() || id),
        description: deck.description?.trim() || `IELTS vocabulary on ${id}.`,
        bandRange: deck.band_range?.trim() || 'Mixed bands',
        count: entries.length,
      };
    })
    .filter((cat) => cat.count > 0)
    .sort((a, b) => a.title.localeCompare(b.title));

const buildWordRecords = (): WordRecord[] => {
  const records: WordRecord[] = [];
  const seen = new Set<string>();

  for (const [path, deck] of Object.entries(wordModules)) {
    const category = fileNameFromPath(path);
    const entries: WordEntry[] = Array.isArray(deck.entries)
      ? deck.entries.filter(isWordEntry)
      : [];
    for (const entry of entries) {
      const id = hashId(`${category}::${entry.word.toLowerCase()}`);
      if (seen.has(id)) continue;
      seen.add(id);
      records.push({
        id,
        word: entry.word,
        category,
        type: entry.type,
        ipa: entry.ipa,
        def_en: entry.def_en,
        def_vi: entry.def_vi,
        example: entry.example,
        synonyms: entry.synonyms,
        band: entry.band,
      });
    }
  }

  return records;
};

export const seedIfNeeded = async (): Promise<number> => {
  const existing = await db.words.count();
  if (existing > 0) return existing;
  const records = buildWordRecords();
  await db.words.bulkPut(records);
  return records.length;
};

export const reseedFromSource = async (): Promise<number> => {
  const records = buildWordRecords();
  await db.words.clear();
  await db.words.bulkPut(records);
  return records.length;
};

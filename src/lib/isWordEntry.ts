import type { WordEntry } from '../types';

export const isWordEntry = (value: unknown): value is WordEntry => {
  const entry = value as Partial<WordEntry>;

  return (
    typeof entry.word === 'string' &&
    typeof entry.type === 'string' &&
    typeof entry.ipa === 'string' &&
    typeof entry.def_en === 'string' &&
    typeof entry.def_vi === 'string' &&
    typeof entry.example === 'string' &&
    Array.isArray(entry.synonyms) &&
    entry.synonyms.every((synonym) => typeof synonym === 'string') &&
    typeof entry.band === 'number'
  );
};

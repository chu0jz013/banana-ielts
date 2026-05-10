export type WordEntry = {
  word: string;
  type: string;
  ipa: string;
  def_en: string;
  def_vi: string;
  example: string;
  synonyms: string[];
  band: number;
};

export type WordDeckJson = {
  category?: string;
  band_range?: string;
  description?: string;
  total_entries?: number;
  entries?: unknown[];
};

export type GoogleVoiceId = 'uk_female' | 'uk_male';

export type GoogleVoiceOption = {
  id: GoogleVoiceId;
  label: string;
  voiceName: string;
  lang: string;
};

export const GOOGLE_VOICES: GoogleVoiceOption[] = [
  {
    id: 'uk_female',
    label: 'UK Female',
    voiceName: 'Google UK English Female',
    lang: 'en-GB',
  },
  {
    id: 'uk_male',
    label: 'UK Male',
    voiceName: 'Google UK English Male',
    lang: 'en-GB',
  },
];

export type WordState = 'new' | 'learning' | 'familiar' | 'known' | 'mastered';

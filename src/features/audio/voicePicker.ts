import { GOOGLE_VOICES, type GoogleVoiceId, type GoogleVoiceOption } from '../../types';

export const getVoiceOption = (id: GoogleVoiceId): GoogleVoiceOption =>
  GOOGLE_VOICES.find((voice) => voice.id === id) ?? GOOGLE_VOICES[0];

const normalizeLang = (lang: string) => lang.toLowerCase().replace('_', '-');

// Heuristic for picking a Safari/iOS en-GB voice that roughly matches the
// requested gender. Names vary across iOS versions.
const SAFARI_FEMALE_HINTS = ['samantha', 'karen', 'tessa', 'serena', 'kate', 'fiona', 'moira'];
const SAFARI_MALE_HINTS = ['daniel', 'arthur', 'oliver', 'aaron', 'fred'];

export const findGoogleVoice = (
  voices: SpeechSynthesisVoice[],
  voiceId: GoogleVoiceId,
): SpeechSynthesisVoice | undefined => {
  if (voices.length === 0) return undefined;

  const target = getVoiceOption(voiceId);
  const targetName = target.voiceName.toLowerCase();
  const targetLang = target.lang.toLowerCase();

  // 1. Exact Google name + lang match (Chrome/Edge desktop)
  const exact = voices.find(
    (voice) =>
      voice.name.toLowerCase() === targetName &&
      normalizeLang(voice.lang) === targetLang,
  );
  if (exact) return exact;

  // 2. Safari heuristic: en-GB voice whose name hints at requested gender
  const enGb = voices.filter((v) => normalizeLang(v.lang) === 'en-gb');
  const hints = voiceId === 'uk_female' ? SAFARI_FEMALE_HINTS : SAFARI_MALE_HINTS;
  const hinted = enGb.find((v) =>
    hints.some((hint) => v.name.toLowerCase().includes(hint)),
  );
  if (hinted) return hinted;

  // 3. Any en-GB voice
  if (enGb.length > 0) return enGb[0];

  // 4. Any English voice
  const anyEn = voices.find((v) => normalizeLang(v.lang).startsWith('en-'));
  return anyEn;
};

export const loadVoices = (): Promise<SpeechSynthesisVoice[]> =>
  new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve([]);
      return;
    }
    const initial = window.speechSynthesis.getVoices();
    if (initial.length > 0) {
      resolve(initial);
      return;
    }
    const handler = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener('voiceschanged', handler);
  });

import { GOOGLE_VOICES, type GoogleVoiceId, type GoogleVoiceOption } from '../../types';

export const getVoiceOption = (id: GoogleVoiceId): GoogleVoiceOption =>
  GOOGLE_VOICES.find((voice) => voice.id === id) ?? GOOGLE_VOICES[0];

const normalizeLang = (lang: string) => lang.toLowerCase().replace('_', '-');

export const findGoogleVoice = (
  voices: SpeechSynthesisVoice[],
  voiceId: GoogleVoiceId,
): SpeechSynthesisVoice | undefined => {
  const target = getVoiceOption(voiceId);
  const targetName = target.voiceName.toLowerCase();
  const targetLang = target.lang.toLowerCase();

  const exact = voices.find(
    (voice) =>
      voice.name.toLowerCase() === targetName &&
      normalizeLang(voice.lang) === targetLang,
  );
  if (exact) return exact;

  const sameLang = voices.find((voice) => normalizeLang(voice.lang) === targetLang);
  if (sameLang) return sameLang;

  return voices.find((voice) => normalizeLang(voice.lang).startsWith('en-'));
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

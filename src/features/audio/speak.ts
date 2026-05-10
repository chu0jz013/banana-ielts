import { findGoogleVoice } from './voicePicker';
import type { GoogleVoiceId } from '../../types';

let cachedVoices: SpeechSynthesisVoice[] = [];

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const refresh = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
  refresh();
  window.speechSynthesis.addEventListener('voiceschanged', refresh);
}

export const speak = (text: string, voiceId: GoogleVoiceId): boolean => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  if (!text) return false;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const voice = findGoogleVoice(cachedVoices, voiceId);
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  } else {
    utterance.lang = 'en-GB';
  }
  utterance.rate = 0.86;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
  return true;
};

export const stopSpeaking = () => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
};

export const speechSupported = (): boolean =>
  typeof window !== 'undefined' && 'speechSynthesis' in window;

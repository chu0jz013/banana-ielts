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

  const synth = window.speechSynthesis;

  // Refresh voices in case they finished loading after first cache.
  const fresh = synth.getVoices();
  if (fresh.length > 0) cachedVoices = fresh;

  // Safari iOS bug: calling cancel() then speak() in the same tick can
  // silence the new utterance. Only cancel when something is actually
  // speaking so cancel() can synchronously clear the queue.
  if (synth.speaking || synth.pending) {
    synth.cancel();
  }

  // Chrome desktop sometimes leaves the synth in a paused state after
  // long idle — speak() then becomes a no-op until resume().
  if (synth.paused) synth.resume();

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

  synth.speak(utterance);
  return true;
};

export const stopSpeaking = () => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
};

export const speechSupported = (): boolean =>
  typeof window !== 'undefined' && 'speechSynthesis' in window;

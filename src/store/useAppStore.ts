import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GoogleVoiceId } from '../types';

export interface BandFilter {
  min: number;
  max: number;
}

interface AppStore {
  selectedCategories: string[] | null;
  voicePreference: GoogleVoiceId;
  bandFilter: BandFilter;
  hasSeenSwipeHint: boolean;
  audioUnlocked: boolean;
  setSelectedCategories: (categories: string[]) => void;
  resetCategories: () => void;
  setVoice: (voice: GoogleVoiceId) => void;
  setBandFilter: (filter: BandFilter) => void;
  markSwipeHintSeen: () => void;
  markAudioUnlocked: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      selectedCategories: null,
      voicePreference: 'uk_female',
      bandFilter: { min: 7.0, max: 9.0 },
      hasSeenSwipeHint: false,
      audioUnlocked: false,
      setSelectedCategories: (categories) => set({ selectedCategories: categories }),
      resetCategories: () => set({ selectedCategories: null }),
      setVoice: (voice) => set({ voicePreference: voice }),
      setBandFilter: (filter) => set({ bandFilter: filter }),
      markSwipeHintSeen: () => set({ hasSeenSwipeHint: true }),
      markAudioUnlocked: () => set({ audioUnlocked: true }),
    }),
    {
      name: 'ielts-feed-settings',
      partialize: (state) => ({
        selectedCategories: state.selectedCategories,
        voicePreference: state.voicePreference,
        bandFilter: state.bandFilter,
        hasSeenSwipeHint: state.hasSeenSwipeHint,
      }),
    },
  ),
);

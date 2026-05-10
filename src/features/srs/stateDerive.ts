import type { ReviewRecord } from '../../data/db';
import type { WordState } from '../../types';

export const deriveState = (review: ReviewRecord | undefined): WordState => {
  if (!review) return 'new';
  const s = review.stability;
  if (s < 7) return 'learning';
  if (s < 30) return 'familiar';
  if (s < 90) return 'known';
  return 'mastered';
};

export const stateLabel: Record<WordState, string> = {
  new: 'Mới',
  learning: 'Đang học',
  familiar: 'Quen',
  known: 'Đã biết',
  mastered: 'Thuộc lòng',
};

export const stateColor: Record<WordState, string> = {
  new: 'text-zinc-400',
  learning: 'text-amber-400',
  familiar: 'text-sky-400',
  known: 'text-emerald-400',
  mastered: 'text-violet-400',
};

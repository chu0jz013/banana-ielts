import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { WordRecord, ReviewRecord } from '../../data/db';
import { db } from '../../data/db';
import { deriveState, stateColor, stateLabel } from '../srs/stateDerive';
import type { WordState } from '../../types';

interface Props {
  word: WordRecord;
  revealed: boolean;
  onReveal: () => void;
}

export const Card = ({ word, revealed, onReveal }: Props) => {
  const [reviewState, setReviewState] = useState<WordState>('new');
  const lastWordId = useRef(word.id);

  useEffect(() => {
    let cancelled = false;
    db.reviews.get(word.id).then((rev: ReviewRecord | undefined) => {
      if (!cancelled) setReviewState(deriveState(rev));
    });
    lastWordId.current = word.id;
    return () => {
      cancelled = true;
    };
  }, [word.id]);

  return (
    <div
      onClick={onReveal}
      className="relative w-full h-full flex flex-col items-center justify-center px-6 select-none bg-bg overflow-hidden"
      role="button"
    >
      <div className="absolute top-[calc(env(safe-area-inset-top)+0.75rem)] left-5 right-5 flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-zinc-200">
            {word.band.toFixed(1)}
          </span>
          <span className="opacity-60">·</span>
          <span className="italic">{word.type}</span>
          <span className="opacity-60">·</span>
          <span className="capitalize">{word.category}</span>
        </div>
        <span className={`text-[10px] uppercase tracking-wider ${stateColor[reviewState]}`}>
          {stateLabel[reviewState]}
        </span>
      </div>

      <div className="flex flex-col items-center text-center gap-2">
        <div className="text-5xl font-bold tracking-tight text-zinc-50 break-words">
          {word.word}
        </div>
        <div className="text-lg text-zinc-400 font-mono">{word.ipa}</div>
        <div className="text-xs text-zinc-500 mt-2">🔊 phát tự động</div>
      </div>

      <AnimatePresence>
        {revealed && (
          <motion.div
            key="reveal"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            data-reveal-sheet="true"
            className="absolute left-0 right-0 bottom-0 max-h-[55%] overflow-y-auto bg-surface/95 backdrop-blur-md rounded-t-3xl px-5 pt-5 pb-[calc(env(safe-area-inset-bottom)+5rem)] border-t border-zinc-800 z-10 overscroll-contain"
          >
            <div className="space-y-4">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">
                  Nghĩa
                </div>
                <div className="text-lg text-emerald-300 font-medium">
                  {word.def_vi}
                </div>
                <div className="text-sm text-zinc-300 mt-1">{word.def_en}</div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">
                  Ví dụ
                </div>
                <div className="text-sm italic text-zinc-200 leading-relaxed">
                  "{word.example}"
                </div>
              </div>

              {word.synonyms.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">
                    Synonyms
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {word.synonyms.map((s) => (
                      <span
                        key={s}
                        className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-200"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

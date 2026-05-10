import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store/useAppStore';
import { GOOGLE_VOICES } from '../../types';
import { speak, speechSupported } from '../audio/speak';
import { db } from '../../data/db';
import { CategoryPicker } from '../onboarding/CategoryPicker';

interface Props {
  onClose: () => void;
}

const Settings = ({ onClose }: Props) => {
  const voicePreference = useAppStore((s) => s.voicePreference);
  const setVoice = useAppStore((s) => s.setVoice);
  const bandFilter = useAppStore((s) => s.bandFilter);
  const setBandFilter = useAppStore((s) => s.setBandFilter);
  const selectedCategories = useAppStore((s) => s.selectedCategories);

  const [pickingCategories, setPickingCategories] = useState(false);
  const [reviewCount, setReviewCount] = useState(0);
  const [bookmarkCount, setBookmarkCount] = useState(0);

  useEffect(() => {
    db.reviews.count().then(setReviewCount);
    db.bookmarks.count().then(setBookmarkCount);
  }, [pickingCategories]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !pickingCategories) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, pickingCategories]);

  if (pickingCategories) {
    return (
      <CategoryPicker
        initial={selectedCategories}
        onDone={() => setPickingCategories(false)}
        onCancel={() => setPickingCategories(false)}
      />
    );
  }

  const exportProgress = async () => {
    const reviews = await db.reviews.toArray();
    const bookmarks = await db.bookmarks.toArray();
    const blob = new Blob(
      [JSON.stringify({ reviews, bookmarks, exportedAt: Date.now() }, null, 2)],
      { type: 'application/json' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ielts-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetProgress = async () => {
    if (!confirm('Xoá toàn bộ tiến độ học (FSRS reviews + bookmarks)?')) return;
    await db.reviews.clear();
    await db.logs.clear();
    await db.bookmarks.clear();
    setReviewCount(0);
    setBookmarkCount(0);
    onClose();
  };

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 280 }}
      className="absolute inset-0 z-40 bg-bg text-zinc-100 overflow-y-auto"
    >
      <header className="flex items-center justify-between px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-3">
        <h2 className="text-xl font-bold">Cài đặt</h2>
        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-200">
          Đóng
        </button>
      </header>

      <div className="px-5 pb-[calc(env(safe-area-inset-bottom)+2rem)] space-y-6">
        {/* Voice */}
        <section>
          <h3 className="text-xs uppercase tracking-widest text-zinc-500 mb-2">
            Giọng phát âm
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {GOOGLE_VOICES.map((v) => (
              <button
                key={v.id}
                onClick={() => setVoice(v.id)}
                className={`px-3 py-3 rounded-xl text-sm border ${
                  voicePreference === v.id
                    ? 'bg-accent/20 border-accent text-zinc-50'
                    : 'bg-surface border-zinc-800 text-zinc-300'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => speak('academic rigor', voicePreference)}
            disabled={!speechSupported()}
            className="mt-2 text-xs text-accent2 disabled:text-zinc-600"
          >
            🔊 Test giọng
          </button>
        </section>

        {/* Band filter */}
        <section>
          <h3 className="text-xs uppercase tracking-widest text-zinc-500 mb-2">
            Band filter ({bandFilter.min.toFixed(1)} – {bandFilter.max.toFixed(1)})
          </h3>
          <div className="space-y-3">
            <label className="block text-xs text-zinc-400">
              Min: {bandFilter.min.toFixed(1)}
              <input
                type="range"
                min={6}
                max={9}
                step={0.5}
                value={bandFilter.min}
                onChange={(e) =>
                  setBandFilter({
                    min: Math.min(Number(e.target.value), bandFilter.max),
                    max: bandFilter.max,
                  })
                }
                className="w-full accent-accent mt-1"
              />
            </label>
            <label className="block text-xs text-zinc-400">
              Max: {bandFilter.max.toFixed(1)}
              <input
                type="range"
                min={6}
                max={9}
                step={0.5}
                value={bandFilter.max}
                onChange={(e) =>
                  setBandFilter({
                    min: bandFilter.min,
                    max: Math.max(Number(e.target.value), bandFilter.min),
                  })
                }
                className="w-full accent-accent mt-1"
              />
            </label>
          </div>
        </section>

        {/* Categories */}
        <section>
          <h3 className="text-xs uppercase tracking-widest text-zinc-500 mb-2">
            Chủ đề đang học
          </h3>
          <button
            onClick={() => setPickingCategories(true)}
            className="w-full text-left bg-surface border border-zinc-800 rounded-xl px-4 py-3 text-sm"
          >
            {selectedCategories && selectedCategories.length > 0
              ? selectedCategories.join(', ')
              : 'Tất cả'}
            <div className="text-xs text-zinc-500 mt-1">Tap để đổi</div>
          </button>
        </section>

        {/* Progress */}
        <section>
          <h3 className="text-xs uppercase tracking-widest text-zinc-500 mb-2">
            Tiến độ
          </h3>
          <div className="bg-surface border border-zinc-800 rounded-xl px-4 py-3 space-y-1 text-sm">
            <div>Đã grade: <span className="text-zinc-50 font-semibold">{reviewCount}</span> từ</div>
            <div>Bookmark: <span className="text-zinc-50 font-semibold">{bookmarkCount}</span> từ</div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button
              onClick={exportProgress}
              className="px-3 py-2 rounded-xl text-sm bg-surface border border-zinc-800"
            >
              Export JSON
            </button>
            <button
              onClick={resetProgress}
              className="px-3 py-2 rounded-xl text-sm bg-rose-950/40 border border-rose-900 text-rose-300"
            >
              Reset progress
            </button>
          </div>
        </section>

        <div className="text-xs text-zinc-600 text-center pt-4">
          IELTS Vocab Feed · Phase 1+2 · local-only
        </div>
      </div>
    </motion.div>
  );
};

export default Settings;

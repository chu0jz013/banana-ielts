import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { getCategoryInfos } from '../../data/seed';
import { useAppStore } from '../../store/useAppStore';

const EMOJI: Record<string, string> = {
  education: '🎓',
  environment: '🌿',
  health: '🩺',
  society: '🏛️',
  technology: '💻',
  work: '💼',
};

interface Props {
  initial?: string[] | null;
  onDone: () => void;
  onCancel?: () => void;
}

export const CategoryPicker = ({ initial, onDone, onCancel }: Props) => {
  const setSelectedCategories = useAppStore((s) => s.setSelectedCategories);
  const categories = useMemo(() => getCategoryInfos(), []);
  const allIds = useMemo(() => categories.map((c) => c.id), [categories]);

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initial && initial.length > 0 ? initial : allIds),
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allOn = selected.size === categories.length;
  const toggleAll = () => {
    setSelected(allOn ? new Set() : new Set(allIds));
  };

  const submit = () => {
    if (selected.size === 0) return;
    setSelectedCategories(Array.from(selected));
    onDone();
  };

  const totalEntries = categories
    .filter((c) => selected.has(c.id))
    .reduce((sum, c) => sum + c.count, 0);

  return (
    <div className="absolute inset-0 bg-bg text-zinc-100 flex flex-col">
      <header className="px-5 pt-[calc(env(safe-area-inset-top)+1rem)] pb-3 flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-zinc-500">
            Bắt đầu
          </p>
          <h1 className="text-2xl font-bold mt-1">
            Bạn muốn học chủ đề nào?
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Có thể đổi sau trong cài đặt.
          </p>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-zinc-400 hover:text-zinc-200 text-sm"
          >
            Huỷ
          </button>
        )}
      </header>

      <div className="px-5 mb-2 flex justify-end">
        <button
          onClick={toggleAll}
          className="text-xs text-accent2 hover:text-accent border border-zinc-700 rounded-full px-3 py-1"
        >
          {allOn ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
        </button>
      </div>

      <div className="flex-1 px-5 pb-32 grid grid-cols-2 gap-3 content-start overflow-y-auto">
        {categories.map((cat) => {
          const isOn = selected.has(cat.id);
          return (
            <motion.button
              key={cat.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => toggle(cat.id)}
              className={`relative aspect-[4/5] rounded-2xl p-4 text-left flex flex-col justify-between transition-colors ${
                isOn
                  ? 'bg-accent/15 border-2 border-accent'
                  : 'bg-surface border-2 border-zinc-800'
              }`}
            >
              <div className="text-4xl">{EMOJI[cat.id] ?? '📘'}</div>
              <div>
                <div className="font-semibold text-base">{cat.title}</div>
                <div className="text-xs text-zinc-400 mt-1">
                  {cat.count} từ · band {cat.bandRange}
                </div>
              </div>
              {isOn && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-accent flex items-center justify-center text-xs text-white">
                  ✓
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-bg/95 backdrop-blur-md px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] border-t border-zinc-800">
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="text-zinc-400">
            {selected.size}/{categories.length} chủ đề · {totalEntries} từ
          </span>
        </div>
        <button
          onClick={submit}
          disabled={selected.size === 0}
          className="w-full h-12 rounded-full bg-accent text-white font-semibold disabled:bg-zinc-800 disabled:text-zinc-500 transition-colors"
        >
          Bắt đầu học →
        </button>
      </div>
    </div>
  );
};

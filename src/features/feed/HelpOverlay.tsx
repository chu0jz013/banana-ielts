import { motion } from 'framer-motion';

interface Props {
  onClose: () => void;
}

const ROWS: Array<[string, string]> = [
  ['↓ · PageDown · J', 'Từ kế tiếp'],
  ['↑ · PageUp · K', 'Từ trước'],
  ['→ · L', 'Đã biết (Easy)'],
  ['← · H', 'Chưa biết (Again)'],
  ['Space · Enter', 'Hiện / ẩn nghĩa'],
  ['R', 'Phát lại audio'],
  ['B', 'Bookmark'],
  ['E · ,', 'Cài đặt'],
  ['? · /', 'Mở hướng dẫn này'],
  ['Esc', 'Đóng overlay'],
];

const Kbd = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-[11px] font-mono text-zinc-100">
    {children}
  </span>
);

const HelpOverlay = ({ onClose }: Props) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={onClose}
    className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
  >
    <motion.div
      initial={{ scale: 0.92, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      exit={{ scale: 0.92, y: 20 }}
      transition={{ type: 'spring', damping: 24, stiffness: 280 }}
      onClick={(e) => e.stopPropagation()}
      className="w-full max-w-sm bg-surface rounded-2xl border border-zinc-800 p-5 text-zinc-200"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-lg font-bold">Phím tắt</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Hoạt động trên desktop · vẫn vuốt được trên mobile
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Đóng"
          className="text-zinc-500 hover:text-zinc-200 text-xl leading-none px-1"
        >
          ×
        </button>
      </div>
      <ul className="space-y-2">
        {ROWS.map(([keys, label]) => {
          const parts = keys.split(' · ');
          return (
            <li
              key={keys}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="text-zinc-300">{label}</span>
              <span className="flex items-center gap-1 flex-wrap justify-end">
                {parts.map((p, i) => (
                  <span key={p} className="flex items-center gap-1">
                    {i > 0 && <span className="text-zinc-600 text-[10px]">/</span>}
                    <Kbd>{p}</Kbd>
                  </span>
                ))}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 pt-3 border-t border-zinc-800 text-[11px] text-zinc-500">
        Gợi ý: cuộn chuột để chuyển từ nhanh hơn.
      </div>
    </motion.div>
  </motion.div>
);

export default HelpOverlay;

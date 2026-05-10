import { motion } from 'framer-motion';

interface Props {
  onReveal: () => void;
  onReplay: () => void;
  onBookmark: () => void;
  onEasy: () => void;
  onAgain: () => void;
  bookmarked: boolean;
  revealed: boolean;
}

const RailButton = ({
  label,
  emoji,
  onClick,
  className = '',
}: {
  label: string;
  emoji: string;
  onClick: () => void;
  className?: string;
}) => (
  <motion.button
    whileTap={{ scale: 0.85 }}
    onClick={onClick}
    aria-label={label}
    className={`w-12 h-12 rounded-full flex items-center justify-center text-xl bg-black/40 backdrop-blur-sm border border-white/10 ${className}`}
  >
    {emoji}
  </motion.button>
);

export const ActionRail = ({
  onReveal,
  onReplay,
  onBookmark,
  onEasy,
  onAgain,
  bookmarked,
  revealed,
}: Props) => (
  <div className="absolute right-3 bottom-32 flex flex-col gap-3 z-20">
    <RailButton
      label={revealed ? 'Ẩn nghĩa' : 'Hiện nghĩa'}
      emoji={revealed ? '🙈' : '❓'}
      onClick={onReveal}
    />
    <RailButton label="Phát lại" emoji="🔁" onClick={onReplay} />
    <RailButton
      label="Bookmark"
      emoji={bookmarked ? '⭐' : '☆'}
      onClick={onBookmark}
      className={bookmarked ? 'text-amber-400' : ''}
    />
    <RailButton label="Đã biết" emoji="✓" onClick={onEasy} className="text-emerald-400" />
    <RailButton label="Chưa biết" emoji="✗" onClick={onAgain} className="text-rose-400" />
  </div>
);

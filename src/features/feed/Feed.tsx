import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "framer-motion";
import { useFeedScheduler } from "./useFeedScheduler";
import { Card } from "./Card";
import { ActionRail } from "./ActionRail";
import { useKeyboardNav } from "./useKeyboardNav";
import { speak, speechSupported, stopSpeaking } from "../audio/speak";
import { gradeCard, Rating } from "../srs/scheduler";
import { db } from "../../data/db";
import { useAppStore } from "../../store/useAppStore";

const HelpOverlay = lazy(() => import("./HelpOverlay"));

const SWIPE_THRESHOLD = 90;
const VELOCITY_THRESHOLD = 600;
const WHEEL_COOLDOWN_MS = 350;
const WHEEL_DELTA_MIN = 14;

interface Props {
  onOpenSettings: () => void;
}

export const Feed = ({ onOpenSettings }: Props) => {
  const voicePreference = useAppStore((s) => s.voicePreference);
  const hasSeenSwipeHint = useAppStore((s) => s.hasSeenSwipeHint);
  const markSwipeHintSeen = useAppStore((s) => s.markSwipeHintSeen);
  const audioUnlocked = useAppStore((s) => s.audioUnlocked);
  const markAudioUnlocked = useAppStore((s) => s.markAudioUnlocked);

  const { current, upcoming, previous, advance, goBack, loading, queueSize } =
    useFeedScheduler();

  const [revealed, setRevealed] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [grading, setGrading] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const [prevCardId, setPrevCardId] = useState<string | null>(null);
  if (current && prevCardId !== current.id) {
    setPrevCardId(current.id);
    setRevealed(false);
    setBookmarked(false);
  }

  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const cardOpacity = useTransform(dragX, [-300, 0, 300], [0.5, 1, 0.5]);
  const swipeHintBg = useTransform(
    dragX,
    [-200, -50, 0, 50, 200],
    [
      "rgba(244,63,94,0.35)",
      "rgba(244,63,94,0)",
      "rgba(0,0,0,0)",
      "rgba(16,185,129,0)",
      "rgba(16,185,129,0.35)",
    ],
  );
  const lastTapRef = useRef<{ ts: number; x: number; y: number } | null>(null);
  const lastWheelTsRef = useRef(0);

  // playWord: synchronous in user-gesture handler. Auto-unlocks audio so
  // even keyboard-only users get sound on first key.
  const playWord = (text?: string) => {
    if (!text) return;
    if (!speechSupported()) return;
    if (!audioUnlocked) markAudioUnlocked();
    speak(text, voicePreference);
  };

  // Reset bookmark state when card changes (async lookup)
  useEffect(() => {
    if (!current) return;
    let cancelled = false;
    db.bookmarks.get(current.id).then((b) => {
      if (!cancelled) setBookmarked(!!b);
    });
    return () => {
      cancelled = true;
    };
  }, [current?.id]);

  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  const nextWord = upcoming[0]?.word;
  const prevWord = previous?.word;

  const handleEasy = async () => {
    if (!current || grading) return;
    setGrading(true);
    playWord(nextWord);
    await gradeCard(current.id, Rating.Easy);
    advance();
    setGrading(false);
  };

  const handleAgain = async () => {
    if (!current || grading) return;
    setGrading(true);
    playWord(nextWord);
    await gradeCard(current.id, Rating.Again);
    advance();
    setGrading(false);
  };

  const handleNeutralNext = () => {
    playWord(nextWord);
    advance();
  };

  const handleGoBack = () => {
    playWord(prevWord);
    goBack();
  };

  const handleReveal = () => {
    if (!current) return;
    playWord(current.word);
    setRevealed((r) => !r);
  };

  const handleReplay = () => {
    if (!current) return;
    playWord(current.word);
  };

  const handleBookmark = async () => {
    if (!current) return;
    if (bookmarked) {
      await db.bookmarks.delete(current.id);
      setBookmarked(false);
    } else {
      await db.bookmarks.put({ wordId: current.id, ts: Date.now() });
      setBookmarked(true);
    }
  };

  const handleEscape = () => {
    if (helpOpen) {
      setHelpOpen(false);
      return;
    }
    if (revealed) {
      setRevealed(false);
    }
  };

  useKeyboardNav(
    {
      onNext: handleNeutralNext,
      onPrev: handleGoBack,
      onEasy: () => void handleEasy(),
      onAgain: () => void handleAgain(),
      onReveal: handleReveal,
      onReplay: handleReplay,
      onBookmark: () => void handleBookmark(),
      onSettings: onOpenSettings,
      onHelp: () => setHelpOpen(true),
      onEscape: handleEscape,
    },
    !!current,
  );

  const handleDragEnd = (_e: unknown, info: PanInfo) => {
    const { offset, velocity } = info;
    const ax = Math.abs(offset.x);
    const ay = Math.abs(offset.y);

    if (ax > ay) {
      if (offset.x > SWIPE_THRESHOLD || velocity.x > VELOCITY_THRESHOLD) {
        void handleEasy();
        return;
      }
      if (offset.x < -SWIPE_THRESHOLD || velocity.x < -VELOCITY_THRESHOLD) {
        void handleAgain();
        return;
      }
    } else {
      if (offset.y < -SWIPE_THRESHOLD || velocity.y < -VELOCITY_THRESHOLD) {
        handleNeutralNext();
        return;
      }
      if (offset.y > SWIPE_THRESHOLD || velocity.y > VELOCITY_THRESHOLD) {
        handleGoBack();
        return;
      }
    }
    dragX.set(0);
    dragY.set(0);
  };

  const handleTap = (e: React.MouseEvent) => {
    if (!current) return;
    if (!audioUnlocked) {
      markAudioUnlocked();
      playWord(current.word);
    }
    if (!hasSeenSwipeHint) markSwipeHintSeen();

    const now = Date.now();
    const last = lastTapRef.current;
    if (last && now - last.ts < 300) {
      handleReplay();
      lastTapRef.current = null;
      return;
    }
    lastTapRef.current = { ts: now, x: e.clientX, y: e.clientY };
    setTimeout(() => {
      if (lastTapRef.current && Date.now() - lastTapRef.current.ts >= 280) {
        handleReveal();
        lastTapRef.current = null;
      }
    }, 300);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (helpOpen) return;
    if (revealed) {
      const inSheet = (e.target as HTMLElement).closest?.(
        "[data-reveal-sheet]",
      );
      if (inSheet) return;
    }

    const now = Date.now();
    const gap = now - lastWheelTsRef.current;
    lastWheelTsRef.current = now;

    if (Math.abs(e.deltaY) < WHEEL_DELTA_MIN) return;
    if (gap < WHEEL_COOLDOWN_MS) return;

    if (!audioUnlocked) markAudioUnlocked();
    if (e.deltaY > 0) handleNeutralNext();
    else handleGoBack();
  };

  if (loading) {
    return (
      <div className="absolute inset-0 bg-bg flex items-center justify-center text-zinc-400">
        Đang tải...
      </div>
    );
  }

  if (!current) {
    return (
      <div className="absolute inset-0 bg-bg flex flex-col items-center justify-center px-6 text-center text-zinc-300 gap-4">
        <div className="text-3xl">🎉</div>
        <div className="text-lg font-semibold">Hết từ rồi!</div>
        <p className="text-sm text-zinc-400 max-w-xs">
          Mọi từ trong filter hiện tại đều đã được học. Mở rộng band hoặc chọn
          thêm chủ đề khác trong cài đặt.
        </p>
        <button
          onClick={onOpenSettings}
          className="mt-2 px-4 py-2 rounded-full bg-accent text-white text-sm"
        >
          Mở cài đặt
        </button>
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 overflow-hidden bg-bg text-zinc-100 touch-none select-none"
      onWheel={handleWheel}
    >
      {/* Top action buttons */}
      <div className="absolute top-[calc(env(safe-area-inset-top)+0.5rem)] right-3 z-30 flex gap-2">
        <button
          onClick={() => setHelpOpen(true)}
          aria-label="Phím tắt"
          title="Phím tắt (?)"
          className="hidden md:flex w-10 h-10 rounded-full bg-zinc-800 border border-zinc-600 items-center justify-center text-zinc-100 hover:bg-zinc-700 transition-colors shadow-lg"
        >
          ?
        </button>
        <button
          onClick={onOpenSettings}
          aria-label="Cài đặt"
          title="Cài đặt (E)"
          className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-600 flex items-center justify-center text-zinc-100 hover:bg-zinc-700 transition-colors shadow-lg"
        >
          ⚙
        </button>
      </div>

      {/* Active card with TikTok-style slide transition */}
      <AnimatePresence initial={false} mode="popLayout">
        <motion.div
          key={current.id}
          className="absolute inset-0"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "-100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 320 }}
        >
          <motion.div
            className="absolute inset-0 touch-none cursor-grab active:cursor-grabbing"
            style={{ x: dragX, y: dragY, opacity: cardOpacity }}
            drag
            dragElastic={0.15}
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            onDragEnd={handleDragEnd}
            onClick={handleTap}
          >
            <Card word={current} revealed={revealed} onReveal={handleReveal} />
            <motion.div
              aria-hidden
              className="absolute inset-0 pointer-events-none z-[5]"
              style={{ backgroundColor: swipeHintBg }}
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>

      <ActionRail
        onReveal={handleReveal}
        onReplay={handleReplay}
        onBookmark={() => void handleBookmark()}
        onEasy={() => void handleEasy()}
        onAgain={() => void handleAgain()}
        bookmarked={bookmarked}
        revealed={revealed}
      />

      {/* First-run hint */}
      {!hasSeenSwipeHint && (
        <div className="absolute left-0 right-0 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-10 flex justify-center pointer-events-none px-3">
          <div className="bg-zinc-900/90 rounded-full px-4 py-2 text-[11px] text-zinc-200 border border-zinc-700 text-center shadow-lg">
            <span className="md:hidden">
              Tap → xem nghĩa · Vuốt ↑ qua từ · ← chưa biết · → đã biết
            </span>
            <span className="hidden md:inline">
              ↑↓ chuyển từ · ←→ chấm điểm · Space xem nghĩa · ? phím tắt
            </span>
          </div>
        </div>
      )}

      {/* Queue debug indicator (dev only) */}
      {import.meta.env.DEV && (
        <div className="absolute bottom-2 left-3 text-[10px] text-zinc-600 z-30">
          queue: {queueSize}
        </div>
      )}

      <AnimatePresence>
        {helpOpen && (
          <Suspense fallback={null}>
            <HelpOverlay onClose={() => setHelpOpen(false)} />
          </Suspense>
        )}
      </AnimatePresence>
    </div>
  );
};

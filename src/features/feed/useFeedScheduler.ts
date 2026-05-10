import { useCallback, useEffect, useRef, useState } from 'react';
import { db, type WordRecord } from '../../data/db';
import { useAppStore } from '../../store/useAppStore';

const TARGET_QUEUE_SIZE = 4; // current + 3 preloaded
const HISTORY_CAP = 50;

const filterByCategoryAndBand = (
  word: WordRecord,
  categories: string[] | null,
  band: { min: number; max: number },
) => {
  if (categories && categories.length > 0 && !categories.includes(word.category)) {
    return false;
  }
  return word.band >= band.min && word.band <= band.max;
};

const pickRandom = <T,>(arr: T[]): T | null =>
  arr.length === 0 ? null : arr[Math.floor(Math.random() * arr.length)];

export const useFeedScheduler = () => {
  const selectedCategories = useAppStore((s) => s.selectedCategories);
  const bandFilter = useAppStore((s) => s.bandFilter);

  const filterSig = `${(selectedCategories ?? []).join(',')}|${bandFilter.min}|${bandFilter.max}`;
  const seenInSession = useRef<Set<string>>(new Set());

  const [prevSig, setPrevSig] = useState(filterSig);
  const [queue, setQueue] = useState<WordRecord[]>([]);
  const [history, setHistory] = useState<WordRecord[]>([]);
  const [loading, setLoading] = useState(true);

  if (prevSig !== filterSig) {
    setPrevSig(filterSig);
    setQueue([]);
    setHistory([]);
    setLoading(true);
  }

  const queueRef = useRef<WordRecord[]>([]);
  const historyRef = useRef<WordRecord[]>([]);
  const filling = useRef(false);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  const pickNextCard = useCallback(async (): Promise<WordRecord | null> => {
    const now = Date.now();
    const dueReviews = await db.reviews
      .where('nextReview')
      .belowOrEqual(now)
      .toArray();
    const dueIds = new Set(dueReviews.map((r) => r.wordId));

    const allWords = await db.words.toArray();
    const available = allWords.filter((w) =>
      filterByCategoryAndBand(w, selectedCategories, bandFilter),
    );

    if (available.length === 0) return null;

    const dueWords = available.filter(
      (w) => dueIds.has(w.id) && !seenInSession.current.has(w.id),
    );
    const reviewedIds = new Set((await db.reviews.toCollection().primaryKeys()) as string[]);
    const newWords = available.filter(
      (w) => !reviewedIds.has(w.id) && !seenInSession.current.has(w.id),
    );

    const tryDue = dueWords.length > 0 && Math.random() < 0.6;
    let pick = tryDue ? pickRandom(dueWords) : pickRandom(newWords);
    if (!pick) pick = pickRandom(dueWords) ?? pickRandom(newWords);
    if (!pick) {
      seenInSession.current.clear();
      pick = pickRandom(available);
    }
    if (pick) seenInSession.current.add(pick.id);
    return pick;
  }, [selectedCategories, bandFilter]);

  // Initial / filter-change load
  useEffect(() => {
    let cancelled = false;
    seenInSession.current = new Set();
    (async () => {
      const next: WordRecord[] = [];
      for (let i = 0; i < TARGET_QUEUE_SIZE; i += 1) {
        const card = await pickNextCard();
        if (!card) break;
        next.push(card);
      }
      if (!cancelled) {
        setQueue(next);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pickNextCard]);

  // Auto-refill: when queue drops below target, fetch deficit only
  useEffect(() => {
    if (loading) return;
    if (filling.current) return;
    if (queue.length >= TARGET_QUEUE_SIZE) return;

    filling.current = true;
    let cancelled = false;
    (async () => {
      const deficit = TARGET_QUEUE_SIZE - queue.length;
      const next: WordRecord[] = [];
      for (let i = 0; i < deficit; i += 1) {
        const card = await pickNextCard();
        if (!card) break;
        next.push(card);
      }
      if (!cancelled && next.length > 0) {
        setQueue((prev) => [...prev, ...next]);
      }
      filling.current = false;
    })();
    return () => {
      cancelled = true;
      filling.current = false;
    };
  }, [queue.length, pickNextCard, loading]);

  const advance = useCallback(() => {
    const head = queueRef.current[0];
    if (!head) return;
    setQueue((prev) => prev.slice(1));
    setHistory((h) => [head, ...h].slice(0, HISTORY_CAP));
  }, []);

  const goBack = useCallback(() => {
    const prev = historyRef.current[0];
    if (!prev) return;
    setHistory((h) => h.slice(1));
    setQueue((q) => [prev, ...q]);
  }, []);

  return {
    current: queue[0] ?? null,
    upcoming: queue.slice(1, 3),
    previous: history[0] ?? null,
    advance,
    goBack,
    loading,
    queueSize: queue.length,
  };
};

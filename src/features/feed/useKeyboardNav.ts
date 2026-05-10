import { useEffect, useRef } from 'react';

export interface KeyboardHandlers {
  onNext: () => void;
  onPrev: () => void;
  onEasy: () => void;
  onAgain: () => void;
  onReveal: () => void;
  onReplay: () => void;
  onBookmark: () => void;
  onSettings: () => void;
  onHelp: () => void;
  onEscape: () => void;
}

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  );
};

export const useKeyboardNav = (handlers: KeyboardHandlers, enabled = true) => {
  const ref = useRef(handlers);

  useEffect(() => {
    ref.current = handlers;
  });

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isEditableTarget(e.target)) return;

      const h = ref.current;
      switch (e.key) {
        case 'ArrowDown':
        case 'PageDown':
        case 'j':
          e.preventDefault();
          h.onNext();
          break;
        case 'ArrowUp':
        case 'PageUp':
        case 'k':
          e.preventDefault();
          h.onPrev();
          break;
        case 'ArrowRight':
        case 'l':
          e.preventDefault();
          h.onEasy();
          break;
        case 'ArrowLeft':
        case 'h':
          e.preventDefault();
          h.onAgain();
          break;
        case ' ':
        case 'Enter':
          e.preventDefault();
          h.onReveal();
          break;
        case 'r':
        case 'R':
          h.onReplay();
          break;
        case 'b':
        case 'B':
          h.onBookmark();
          break;
        case 'e':
        case 'E':
        case ',':
          h.onSettings();
          break;
        case '?':
        case '/':
          e.preventDefault();
          h.onHelp();
          break;
        case 'Escape':
          h.onEscape();
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled]);
};

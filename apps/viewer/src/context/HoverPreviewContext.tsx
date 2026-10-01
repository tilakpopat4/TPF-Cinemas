import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { Film } from '../types';

export interface HoverPreviewContextType {
  activeFilm: Film | null;
  sourceRect: DOMRect | null;
  isOpen: boolean;
  triggerEnter: (film: Film, rect: DOMRect) => void;
  triggerLeave: () => void;
  portalEnter: () => void;
  portalLeave: () => void;
  closeImmediately: () => void;
}

const HoverPreviewContext = createContext<HoverPreviewContextType | null>(null);

export const HoverPreviewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeFilm, setActiveFilm] = useState<Film | null>(null);
  const [sourceRect, setSourceRect] = useState<DOMRect | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const enterTimerRef = useRef<NodeJS.Timeout | null>(null);
  const leaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = useCallback(() => {
    if (enterTimerRef.current) {
      clearTimeout(enterTimerRef.current);
      enterTimerRef.current = null;
    }
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  }, []);

  const closeImmediately = useCallback(() => {
    clearTimers();
    setIsOpen(false);
    setActiveFilm(null);
    setSourceRect(null);
  }, [clearTimers]);

  const triggerEnter = useCallback((film: Film, rect: DOMRect) => {
    // Clear any pending leave timer (e.g. fast traversal between cards)
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }

    // If another preview is already open, switch faster (150ms buffer)
    const delay = isOpen ? 150 : 350;

    if (enterTimerRef.current) {
      clearTimeout(enterTimerRef.current);
    }

    enterTimerRef.current = setTimeout(() => {
      setActiveFilm(film);
      setSourceRect(rect);
      setIsOpen(true);
      enterTimerRef.current = null;
    }, delay);
  }, [isOpen]);

  const triggerLeave = useCallback(() => {
    // Clear pending enter
    if (enterTimerRef.current) {
      clearTimeout(enterTimerRef.current);
      enterTimerRef.current = null;
    }

    // 200ms grace period to allow mouse to move into the portal popover
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
    }

    leaveTimerRef.current = setTimeout(() => {
      setIsOpen(false);
      setActiveFilm(null);
      setSourceRect(null);
      leaveTimerRef.current = null;
    }, 200);
  }, []);

  const portalEnter = useCallback(() => {
    // Mouse entered into the floating portal card — cancel any closing timer
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  }, []);

  const portalLeave = useCallback(() => {
    // Mouse left the floating portal card — start grace period to close
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
    }
    leaveTimerRef.current = setTimeout(() => {
      setIsOpen(false);
      setActiveFilm(null);
      setSourceRect(null);
      leaveTimerRef.current = null;
    }, 200);
  }, []);

  // Close immediately on page scroll so preview doesn't drift away from the card
  useEffect(() => {
    const handleScroll = () => {
      if (isOpen) {
        closeImmediately();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimers();
    };
  }, [isOpen, closeImmediately, clearTimers]);

  return (
    <HoverPreviewContext.Provider
      value={{
        activeFilm,
        sourceRect,
        isOpen,
        triggerEnter,
        triggerLeave,
        portalEnter,
        portalLeave,
        closeImmediately,
      }}
    >
      {children}
    </HoverPreviewContext.Provider>
  );
};

export const useHoverPreview = (): HoverPreviewContextType => {
  const context = useContext(HoverPreviewContext);
  if (!context) {
    throw new Error('useHoverPreview must be used within a HoverPreviewProvider');
  }
  return context;
};

/**
 * TPF Cinemas — Motion animation presets
 *
 * Rules enforced here:
 * - Only transform + opacity are animated (never height/width/top/left)
 * - All variants gate on prefersReducedMotion
 * - Viewer: expressive springs. Studio/Staff: minimal eases.
 * - Durations: 150–200ms UI feedback, 300ms modals, 400–500ms hero/entrance.
 */

import { useReducedMotion } from 'motion/react';

export { useReducedMotion };

// ─── Spring configs ────────────────────────────────────────────────────────────

/** Snappy spring for UI feedback (buttons, toggles) */
export const springSnappy = { type: 'spring', stiffness: 500, damping: 30, mass: 0.8 } as const;

/** Natural spring for cards and overlays */
export const springNatural = { type: 'spring', stiffness: 300, damping: 28, mass: 1 } as const;

/** Gentle spring for hero/entrance (viewer only) */
export const springGentle = { type: 'spring', stiffness: 180, damping: 22, mass: 1 } as const;

/** Simple ease for Studio/Staff (minimal motion) */
export const easeMinimal = { duration: 0.15, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] } as const;

// ─── Variant factories ────────────────────────────────────────────────────────

/**
 * Fade + slide-up entrance.
 * @param reduced - pass the result of useReducedMotion()
 * @param expressive - true for viewer, false for studio/staff
 */
export function fadeSlideUp(reduced: boolean | null, expressive = false) {
  if (reduced) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1, transition: { duration: 0.01 } },
      exit:    { opacity: 0, transition: { duration: 0.01 } },
    };
  }
  const y = expressive ? 24 : 10;
  const transition = expressive ? springNatural : easeMinimal;
  return {
    initial: { opacity: 0, y },
    animate: { opacity: 1, y: 0, transition },
    exit:    { opacity: 0, y: y / 2, transition: { duration: 0.15, ease: [0.4, 0, 1, 1] as [number, number, number, number] } },
  };
}

/**
 * Fade-only (for overlays/backdrops — no translateY)
 */
export function fadeOnly(reduced: boolean | null) {
  const duration = reduced ? 0.01 : 0.2;
  return {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration } },
    exit:    { opacity: 0, transition: { duration: reduced ? 0.01 : 0.15 } },
  };
}

/**
 * Scale + fade for modals / overlays.
 * Scales from 0.96 → 1 (transform only, never affects layout).
 */
export function scaleModal(reduced: boolean | null) {
  if (reduced) return fadeOnly(null);
  return {
    initial: { opacity: 0, scale: 0.96, y: 8 },
    animate: { opacity: 1, scale: 1, y: 0, transition: springNatural },
    exit:    { opacity: 0, scale: 0.97, y: 4, transition: { duration: 0.15, ease: [0.4, 0, 1, 1] as [number, number, number, number] } },
  };
}

/**
 * Stagger container — wrap list items for cascading entrance.
 */
export function staggerContainer(reduced: boolean | null, staggerSecs = 0.06) {
  return {
    animate: {
      transition: {
        staggerChildren: reduced ? 0 : staggerSecs,
        delayChildren: 0,
      },
    },
  };
}

/**
 * Single item variant used inside a stagger container.
 */
export function staggerItem(reduced: boolean | null, expressive = false) {
  return fadeSlideUp(reduced, expressive);
}

/**
 * Hero billboard entrance (viewer only) — separate slide for text layers.
 */
export function heroBillboardText(reduced: boolean | null) {
  if (reduced) return fadeOnly(null);
  return {
    initial: { opacity: 0, y: 32 },
    animate: { opacity: 1, y: 0, transition: { ...springGentle, delay: 0.1 } },
  };
}

export function heroBillboardBadge(reduced: boolean | null) {
  if (reduced) return fadeOnly(null);
  return {
    initial: { opacity: 0, scale: 0.88, y: 8 },
    animate: { opacity: 1, scale: 1, y: 0, transition: { ...springSnappy, delay: 0.05 } },
  };
}

// ─── Rail stagger variants (named-variant style) ──────────────────────────────

/**
 * Parent container for a stagger rail.
 * Trigger by setting animate="visible" when the rail enters the viewport.
 */
export function railContainer(reduced: boolean | null) {
  return {
    variants: {
      hidden: {},
      visible: {
        transition: {
          staggerChildren: reduced ? 0 : 0.06,
          delayChildren: reduced ? 0 : 0.05,
        },
      },
    },
    initial: 'hidden',
    animate: 'hidden', // caller overrides to 'visible' once inView
  };
}

/**
 * Individual card item inside a stagger rail container.
 */
export function railItem(reduced: boolean | null) {
  if (reduced) {
    return {
      variants: {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.01 } },
      },
    };
  }
  return {
    variants: {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: springNatural,
      },
    },
  };
}

// ─── Re-export Motion hooks for convenience ───────────────────────────────────
export { useScroll, useTransform } from 'motion/react';

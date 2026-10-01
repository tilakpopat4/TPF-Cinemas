# TPF Cinemas — Animation Rules

## Library
- Use **`motion/react`** (already installed in all three apps). Never install Framer Motion, GSAP, anime.js, or any other animation library.
- Import from `../../lib/motion` (or `../lib/motion`) for shared presets: `fadeSlideUp`, `scaleModal`, `fadeOnly`, `staggerContainer`, `staggerItem`, `heroBillboardText`, `heroBillboardBadge`, `springSnappy`, `springNatural`, `springGentle`, `easeMinimal`.

## What to animate
- **ONLY** `transform` (translate, scale, rotate) and `opacity`.
- **NEVER** animate `height`, `width`, `top`, `left`, `margin`, `padding`, or any layout property. Use `transform: translateY` instead of `top`/`margin`, and `scaleX` instead of `width`.

## Reduced motion
- Every animated component **must** call `const reduced = useReducedMotion()` and pass it to the preset factories.
- When `reduced` is true, presets collapse to instantaneous opacity-only transitions (duration ≤ 0.01s).

## Duration guidelines
| Context | Duration |
|---------|----------|
| Button tap / hover | 150ms (spring) |
| Dropdown / menu | 150–200ms |
| Modal enter/exit | 200–250ms (scaleModal preset) |
| Stagger list items | 200ms each, 60ms stagger |
| Hero entrance (viewer only) | 300–500ms (springGentle) |

## App-level expressiveness
- **Viewer**: expressive — use springs, stagger lists, hero entrance sequences, card lift on hover (`y: -4`).
- **Studio**: minimal — modals use `scaleModal`, buttons may use `whileTap` spring, no stagger or hero effects.
- **Staff**: minimal — same as Studio. The review workflow is task-focused; never add decorative motion.

## Non-blocking rule
- **Video must always be playable** regardless of animation state. Never wrap `<iframe>` or `<video>` elements in a `motion.*` component. The video container div may be a motion element, but the media element itself must not be.
- Never use `AnimatePresence` around a video player.

## Forbidden patterns
```tsx
// ❌ Never do this
animate={{ height: 'auto' }}
animate={{ width: '100%' }}
style={{ top: animatedValue }}
transition={{ duration: 0 }} // Use 0.01 for reduced, not 0

// ✅ Do this instead
animate={{ opacity: 1, y: 0 }}
animate={{ opacity: 1, scaleX: 1 }}
```

## Step stepper / wizard
- When advancing steps in `FilmEditorModal`, use `AnimatePresence mode="wait"` with `fadeSlideUp(reduced, false)` on the step content panel.

## Tailwind transition classes
- Remove `transition-all`, `hover:scale-*`, `active:scale-*` Tailwind classes from any element whose hover/tap is handled by Motion `whileHover`/`whileTap`.
- CSS `transition-colors` and `transition-opacity` on Tailwind classes are fine to keep for color-only changes.

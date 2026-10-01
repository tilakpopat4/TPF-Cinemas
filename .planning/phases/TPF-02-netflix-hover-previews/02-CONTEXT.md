# Phase 2 Context: Netflix-Style Hover Previews

**Phase:** Phase 2: Netflix-Style Hover Previews (`TPF-02`)  
**Status:** Planning  
**Requirements:** `HOVER-01`, `HOVER-02`, `HOVER-03`, `HOVER-04`  
**Target Codebase:** `apps/viewer`

---

## 1. Objective & Scope

Implement a Netflix-grade hover card preview system for all film cards in the viewer application. When a user hovers over a film card on desktop, after an intentional 350ms buffer, the card expands smoothly into a rich floating preview card featuring:
- Seamless video trailer / teaser loop (or high-res backdrop fallback).
- Film classification metadata (age rating badge, 4K/HD, duration, release year, genre tags).
- 2-line synopsis preview.
- Interactive quick actions (Play Now, Watchlist toggle, Like/Reaction button, and More Info modal trigger).
- Intelligent edge collision detection and portal mounting so cards never clip inside `overflow-x-auto` rails or overflow viewport edges.

---

## 2. Technical Architecture & Decisions

### Decision 1: Floating Portal Mount vs. In-Rail Scaling
- **Problem:** `ContentRail.tsx` uses `overflow-x-auto` to allow horizontal scrolling of film posters. If an element scales up with CSS `transform: scale(...)` inside an overflow container, it gets clipped at top/bottom or causes unwanted horizontal scroll jumps.
- **Decision:** Use a React Portal (`createPortal` to `document.body` or a dedicated `#hover-preview-root`) to render the expanded `HoverPreviewCard`.
- **Mechanism:** 
  1. The base `FilmCard` captures `onMouseEnter` and records its DOM `getBoundingClientRect()`.
  2. A 350ms debounce timer starts. If the mouse leaves before 350ms, the timer is cleared and nothing opens.
  3. When 350ms elapses, active hover state is emitted (or registered in a lightweight context / hook `useHoverPreview`).
  4. The portal card renders at the exact viewport coordinates `[rect.top, rect.left]`, then smoothly animates scale (`1.0` -> `1.25` or `1.3`) and layout using Framer Motion springs (`damping: 24, stiffness: 260`).
  5. When mouse leaves the expanded preview card (with a gentle 200ms exit buffer to prevent accidental flickers), the preview smoothly collapses and unmounts.

### Decision 2: Edge Collision Detection & Clamping (`HOVER-04`)
- **Left Edge:** If `rect.left < 40px`, anchor from the left or clamp `left = 16px` to prevent extending beyond the left browser edge.
- **Right Edge:** If `rect.right > window.innerWidth - 40px`, anchor from the right or clamp `left = window.innerWidth - expandedWidth - 16px`.
- **Top / Vertical:** Offset slightly upwards (`top = rect.top - 20px`) to give the card visual elevation without colliding with sticky headers.

### Decision 3: Teaser Video Autoplay in Hover Preview (`HOVER-02`)
- **Video Source:** Extract YouTube ID from `film.video_ref` (or direct video stream).
- **Playback Delay:** After the card finishes expanding (~250ms), the muted video teaser starts playing automatically.
- **Fallback:** High-res poster / backdrop image with a subtle zoom gradient if video is unavailable or loading.

### Decision 4: Quick-Action Controls (`HOVER-03`)
- **Play Button:** Launches `onPlay(film)` (opens `WatchModal`).
- **Watchlist Toggle:** Toggles `onToggleWatchlist(film.id)` with immediate feedback.
- **Like / Reaction Button:** Allows viewers to like/thumb up the film, persisted in local storage or state.
- **More Info Trigger:** Opens `MoreInfoModal` with the selected film.

---

## 3. Plan Decomposition

1. **`02-01-PLAN.md`**: Core Hover Preview Engine & Portal
   - Build `HoverPreviewPortal.tsx` and `useHoverPreview` hook / context.
   - Implement 350ms hover delay, 200ms exit buffer, and viewport edge collision detection.
   - Smooth Framer Motion spring pop-out animation and glassmorphic backdrop.
2. **`02-02-PLAN.md`**: Video Teaser, Actions & Rail Integration
   - Embed muted YouTube teaser loop with fallback poster and volume indicator.
   - Wire interactive buttons (Play, Watchlist, Like, More Info).
   - Integrate into `FilmCard.tsx`, `ContentRail.tsx`, and `App.tsx`.
   - Full build test and verification.

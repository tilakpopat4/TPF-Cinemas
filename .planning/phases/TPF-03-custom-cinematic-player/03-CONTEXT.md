# Phase 3 Context: Custom Cinematic Video Player

**Phase:** Phase 3: Custom Cinematic Video Player (`TPF-03`)  
**Status:** Planning  
**Requirements:** `PLAYER-01`, `PLAYER-02`, `PLAYER-03`, `PLAYER-04`  
**Target Codebase:** `apps/viewer`

---

## 1. Objective & Vision

Replace default third-party embedded video chrome (such as red YouTube scrub bars, branding logos, and generic popups) with our own proprietary, state-of-the-art **Cinematic Video Player**.

The custom player will be deeply integrated into the platform's visual identity:
- **Primary Color:** Amber-500 (`#f59e0b`) glowing progress bar, indicators, and highlights.
- **Background & Canvas:** Deep cinematic black (`#08090c`) with glassmorphic controls (`rgba(10, 12, 18, 0.85)` + `backdrop-blur-xl`).
- **Accent Details:** Amber-to-Ruby gradients (`from-amber-500 to-rose-600`), polished monospace typography, and subtle glow drop-shadows.

---

## 2. Architectural Design

### 2.1 Unified Chromeless Video Engine (`PLAYER-04`)
- **Dual Engine Architecture**:
  1. **YouTube Engine**: When `film.video_ref` is a YouTube ID/URL, initialize the chromeless YouTube IFrame API (`new window.YT.Player`) with `controls: 0, modestbranding: 1, rel: 0, showinfo: 0, disablekb: 1`. All default YouTube overlays are suppressed.
  2. **HTML5 / CDN Engine**: When `film.video_provider === 'mux'` or video link is direct MP4/HLS, use standard HTML5 `<video>` element.
- **Unified Controller State**:
  - `currentTime`: number (seconds)
  - `duration`: number (seconds)
  - `bufferedPercent`: number (0 - 100)
  - `isPlaying`: boolean
  - `volume`: number (0 - 1)
  - `isMuted`: boolean
  - `playbackRate`: number (0.5 to 2.0)
  - `isFullscreen`: boolean

### 2.2 Custom Amber Scrubber Bar (`PLAYER-01`)
- Hover expansion: Idle height `6px`, expanding on hover to `10px` for precision seek.
- Buffer layer: Translucent white track showing cached video stream.
- Played layer: Luminous amber gradient (`from-amber-600 to-amber-400`) with glow shadow (`0 0 12px rgba(245, 158, 11, 0.6)`).
- Scrub thumb: Amber circle with white core, hidden at rest, appearing on hover or active dragging.
- Floating tooltip: Follows pointer along the scrubber track displaying the exact timestamp preview (`MM:SS`).

### 2.3 Transport & Control HUD (`PLAYER-02`, `PLAYER-03`)
- **Bottom Control Row**:
  - Play/Pause button with smooth icon morph.
  - Rewind 10s and Fast-Forward 10s with micro-rotation animation.
  - Audio cluster: Speaker icon (with dynamic waves based on volume level) + expandable horizontal amber volume slider.
  - Time readout: `12:45 / 45:00` in clean monospace font.
  - Film title & chapter/part indicator.
  - Playback speed dropdown popover (0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x).
  - Info & Chat drawer toggle.
  - Fullscreen toggle with Document Fullscreen API sync.
- **Center-Screen Feedback Ripples**:
  - Toggling play/pause triggers a large central glowing amber icon that pulses and dissolves (`scale: [0.8, 1.3]`, `opacity: [0.9, 0]`).
  - Double-clicking left/right triggers quick seek ripple (+10s / -10s).
- **Auto-Hide & Cursor Control**:
  - Inactivity timer (3.5s) fades controls out (`opacity-0`).
  - Cursor hides (`cursor-none`) during playback so no mouse pointer distracts the viewer.

---

## 3. Plan Decomposition

1. **`03-01-PLAN.md`**: Core Custom Player Engine & Amber Scrubber
   - Build `CinematicPlayer.tsx` engine wrapper supporting chromeless YouTube API and HTML5 video.
   - Build custom `AmberScrubber.tsx` with drag seeking, buffer indicator, and hover time preview tooltip.
2. **`03-02-PLAN.md`**: Transport Controls, HUD, Audio Slider & Shortcuts
   - Build custom bottom transport toolbar (play/pause, volume slider, 10s skips, speed menu, time display).
   - Implement keyboard shortcuts (Space, J, K, L, M, F, I, Esc) and center ripple animations.
   - Integrate with `WatchModal.tsx` and verify clean build.

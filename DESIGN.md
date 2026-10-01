---
name: TPF Cinemas
description: Independent Cinema Streaming & Filmmaker Distribution Portal
colors:
  primary: "#f59e0b"
  primary-hover: "#d97706"
  primary-glow: "rgba(245, 158, 11, 0.5)"
  canvas: "#08090c"
  surface-card: "#101218"
  surface-glass: "rgba(16, 18, 24, 0.85)"
  surface-elevated: "#181b24"
  border-glass: "rgba(255, 255, 255, 0.1)"
  text-primary: "#ffffff"
  text-secondary: "#a1a1aa"
  text-muted: "#71717a"
  accent-rose: "#e11d48"
  pure-black: "#000000"
  zinc-950: "#09090b"
  zinc-900: "#18181b"
  zinc-800: "#27272a"
  zinc-700: "#3f3f46"
  zinc-600: "#52525b"
  zinc-500: "#71717a"
  zinc-400: "#a1a1aa"
  zinc-300: "#d4d4d8"
  zinc-200: "#e4e4e7"
  zinc-100: "#f4f4f5"
typography:
  display:
    fontFamily: "Outfit, system-ui, sans-serif"
    fontSize: "36px"
    fontWeight: 700
    letterSpacing: "-0.02em"
  h1:
    fontSize: "28px"
    fontWeight: 700
  h2:
    fontSize: "20px"
    fontWeight: 700
  h3:
    fontSize: "16px"
    fontWeight: 600
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "14px"
    lineHeight: "1.5"
  small:
    fontSize: "12px"
    lineHeight: "1.4"
  caption:
    fontSize: "11px"
    lineHeight: "1.3"
  micro:
    fontSize: "10px"
    lineHeight: "1.2"
  badge:
    fontSize: "9px"
    lineHeight: "1.1"
  nano:
    fontSize: "8px"
    lineHeight: "1"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
rounded:
  sm: "6px"
  md: "10px"
  lg: "14px"
  xl: "20px"
  full: "9999px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#000000"
    rounded: "{rounded.full}"
    padding: "10px 24px"
  badge-age:
    backgroundColor: "rgba(255, 255, 255, 0.05)"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
---

# Design System: TPF Cinemas

## Overview
TPF Cinemas delivers an immersive, cinema-first streaming atmosphere inspired by high-end cinema theaters (Netflix / MUBI). The aesthetic prioritizes film artwork, rich contrast, and unencumbered playback.

## Colors
- **Canvas (`#08090c`):** Deep theater black that makes film stills and video trailers pop.
- **Amber Accent (`#f59e0b`):** Signature gold/amber glow used for primary CTAs, active states, scrubber playback, and debut ribbons.
- **Glass Surfaces (`rgba(16, 18, 24, 0.85)`): Translucent glass panels with `backdrop-blur-xl` and `border-white/10`.
- **Text:** Pure white headings (`#ffffff`), zinc-400 body text (`#a1a1aa`), and zinc-500 muted metadata.

## Typography
- **Display & Headings:** Bold, punchy display font with slight tracking contraction for cinematic weight.
- **Body:** Neutral, highly legible sans-serif (`Inter`, `system-ui`).
- **Timecodes & Scrubber:** Monospace font for timekeeping readouts (`04:12 / 28:00`).

## Layout
- **Hero Billboard:** Sized to ~82vh with dual dark gradient masking (`from-[#08090c]` bottom and left fades).
- **Content Rails:** Horizontal scrolling containers with smooth touch swipe and chevron navigation.
- **Theater Player:** Edge-to-edge 100vw × 100vh canvas with auto-hiding controls on inactivity.

## Elevation & Depth
- **Hover Previews:** Pop out via React Portals with `shadow-[0_25px_50px_-12px_rgba(0,0,0,0.9)]` and `z-50` elevation.
- **Vignettes:** Radial and linear gradient masking that melts images into the background.

## Shapes
- Buttons and pills use fluid rounded shapes (`rounded-full` or `rounded-xl`).
- Cards feature subtle `rounded-xl` corners with hairline glass borders (`border-white/10`).

## Components
- **Hero Billboard:** Multi-title rotating billboard with ambient muted video teaser loop.
- **Hover Preview Card:** 350ms buffered popover with video loop, classification badges, and action buttons.
- **Cinematic Player:** Edge-to-edge custom playback engine with Amber progress scrubber, 10s skips, and info drawer.
- **Film Card:** Clean vertical poster with age rating and duration indicators.

## Do's and Don'ts
- **DO** use Amber-500 (`#f59e0b`) as the primary glow and action color.
- **DO** maintain deep dark vignettes (`#08090c`) for high contrast readability.
- **DO** auto-hide player chrome during continuous playback.
- **DON'T** introduce generic blue or green accent buttons.
- **DON'T** clip expanded hover cards inside horizontal scroll rails.
- **DON'T** display third-party player branding or red progress bars.

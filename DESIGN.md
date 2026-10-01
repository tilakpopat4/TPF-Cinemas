---
name: TPF Cinemas
description: Hand-crafted Independent Cinema OTT Platform & Filmmaker Distribution Portal
colors:
  canvas: "#0A0A0B"
  graphite: "#1A1A1D"
  ivory: "#F2EEE6"
  signature: "#FF9F1C"
  signature-hover: "#f79612"
  muted: "#8E8E93"
  hairline: "rgba(242, 238, 230, 0.12)"
  hairline-signature: "rgba(255, 159, 28, 0.35)"
  hairline-accent: "rgba(242, 238, 230, 0.25)"
  hairline-subtle: "rgba(242, 238, 230, 0.1)"
  hairline-faint: "rgba(242, 238, 230, 0.7)"
  pure-black: "#000000"
  pure-white: "#FFFFFF"
typography:
  display:
    fontFamily: "Bebas Neue, Oswald, sans-serif"
    fontSize: "36px"
    fontWeight: 400
    letterSpacing: "0.04em"
  editorial:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "24px"
    lineHeight: "1.18"
    letterSpacing: "-0.015em"
  h1:
    fontFamily: "Bebas Neue, Oswald, sans-serif"
    fontSize: "40px"
    fontWeight: 400
    lineHeight: "1.1"
  h2:
    fontFamily: "Bebas Neue, Oswald, sans-serif"
    fontSize: "28px"
    fontWeight: 400
    lineHeight: "1.15"
  h3:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: "1.2"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "14px"
    lineHeight: "1.6"
  body-sm:
    fontSize: "12px"
    lineHeight: "1.5"
  caption:
    fontSize: "11px"
    lineHeight: "1.4"
  micro:
    fontSize: "10px"
    lineHeight: "1.3"
  badge:
    fontSize: "9px"
    lineHeight: "1.2"
  nano:
    fontSize: "8px"
    lineHeight: "1.1"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
rounded:
  none: "0px"
  sm: "2px"
  md: "4px"
components:
  button-primary:
    backgroundColor: "{colors.signature}"
    textColor: "#000000"
    rounded: "{rounded.sm}"
    padding: "10px 22px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ivory}"
    borderColor: "{colors.hairline-accent}"
    rounded: "{rounded.sm}"
    padding: "10px 20px"
---

# Design System: TPF Cinemas

## Philosophy
TPF Cinemas is an editorial, cinema-first independent streaming platform designed in the spirit of MUBI, Letterboxd, and The Criterion Channel. It intentionally breaks away from cookie-cutter AI and SaaS templates: no purple/blue gradients, no neon glow, no rounded-full pills everywhere.

## Brand & Palette
- **Canvas (`#0A0A0B`):** Near-black foundation for 90% of screen space.
- **Graphite (`#1A1A1D`):** Solid tactile card backings, toolbars, and elevation surfaces.
- **Ivory (`#F2EEE6`):** Warm, high-legibility light surface for typography and artwork frames.
- **Electric Amber (`#FF9F1C`):** Strict 5% signature accent used exclusively for primary CTAs, active indicators, and timeline progress. Never mixed with rival bright hues.
- **Hairlines (`rgba(242, 238, 230, 0.12)`): 1px structural dividing lines instead of blurry drop shadows.

## Typography
Three distinct faces, each with a single dedicated role:
1. **Bebas Neue**: Architectural headers, uppercase display masthead, rail titles.
2. **Cormorant Garamond**: Editorial headlines, curatorial notes, director credits, synopses.
3. **Inter**: Plain, functional UI copy, timecodes, navigation links, forms.

## Layout & Geometry
- **2.39:1 Letterbox Frames:** Cinema-standard widescreen aspect ratios.
- **8px Asymmetric Grid:** Intentional layout asymmetry and varying card sizes by importance.
- **Sharp Geometry:** Minimalist 2px corners (`rounded-sm`), zero rounded-full pill buttons.
- **Layered Depth:** Physical contrast of graphite over canvas with 1px hairline borders instead of blurry drop shadows.
- **Film Grain Texture:** Subtle 2.8% noise overlay over hero media.

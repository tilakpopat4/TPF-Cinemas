# Phase 04: Dynamic Content Rails & Ranked Lists - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-02
**Phase:** 04-Dynamic Content Rails & Ranked Lists
**Areas discussed:** Top 10 Ranked Rail Visual Style, Continue Watching Qualification & Dismissal

---

## Top 10 Ranked Rail Visual Style

| Option | Description | Selected |
|--------|-------------|----------|
| Giant stroked outline numerals overlapping the poster left edge | High-impact Netflix style with deep typographic layering | ✓ |
| Side-by-side standalone numbers | Numerals positioned cleanly to the left of each poster without obstructing artwork | |
| Corner rank badges | Elegant metallic amber badges pinned to the poster's top-left corner | |

**User's choice:** Giant stroked outline numerals overlapping the poster left edge.

---

### Top 10 Palette & Styling

| Option | Description | Selected |
|--------|-------------|----------|
| Metallic silver-to-white stroke with dark semi-transparent fill and subtle amber glow on card hover | Balanced high-contrast cinematic numeral treatment | ✓ |
| Solid glowing amber gradient | Bold brand signature color matching the TPF amber player theme | |
| Editorial serif outline | Styled in TPF's festival masthead serif font for a prestigious cinema look | |

**User's choice:** Metallic silver-to-white stroke with dark semi-transparent fill and subtle amber glow on card hover.

---

### Top 10 Hover Preview Interaction

| Option | Description | Selected |
|--------|-------------|----------|
| Numerals stay anchored in the rail while the poster card smoothly lifts and expands into the hover portal preview | Clean layer separation without clipping or layout jumping | ✓ |
| Numeral and poster expand together as a unified ranked card in the hover preview | Unified expansion | |
| You decide | Agent discretion | |

**User's choice:** Numerals stay anchored in the rail while the poster card smoothly lifts and expands into the hover portal preview.

---

### Top 10 Selection & Sorting

| Option | Description | Selected |
|--------|-------------|----------|
| Dynamically ranked by view count / popularity from catalogue, labeled 'Top 10 in India' | Automatic popularity ranking reflecting viewer activity | ✓ |
| Curated featured list with rank override flag from film metadata | Manual editorial ordering | |
| You decide | Agent discretion | |

**User's choice:** Dynamically ranked by view count / popularity from catalogue, labeled 'Top 10 in India'.

---

## Continue Watching Qualification & Dismissal

### Playback Threshold

| Option | Description | Selected |
|--------|-------------|----------|
| Between 15s and 90% completion | Filters out accidental clicks and finished credits | ✓ |
| Any non-zero progress (> 0s) up to 95% completion | Broad qualification | |
| Minimum 60s watched to qualify for the resume queue | Strict engagement filter | |

**User's choice:** Between 15s and 90% completion.

---

### Dismissal Mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| An 'X' dismiss button on card hover and in hover preview | Immediately removes item and syncs with Supabase | ✓ |
| Only in hover preview portal | Keeps base cards clean while providing dismissal control | |
| Automatic removal only | No manual dismiss button; drops out automatically once 90% is reached | |

**User's choice:** An 'X' dismiss button on card hover and in hover preview — Immediately removes item and syncs with Supabase.

---

### Resume Playback Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Direct instant resume at last position | Starts video immediately at progress_seconds with HUD showing exact resume point | ✓ |
| Prompt dialog | Offers 'Resume from MM:SS' or 'Start from Beginning' before launching video | |
| You decide | Agent discretion | |

**User's choice:** Direct instant resume at last position — Starts video immediately at progress_seconds with HUD showing exact resume point.

---

### Progress Visual Presentation

| Option | Description | Selected |
|--------|-------------|----------|
| Glowing amber progress bar on card bottom + 'Resume • XXm left' badge in clean monospace metadata | High-polish signature dark cinema aesthetic | ✓ |
| Percentage-based badge ('65% watched') above the amber progress line | Simple percentage metric | |
| Full time summary ('45m of 1h 20m watched') displayed beneath the title | Detailed time breakdown | |

**User's choice:** Glowing amber progress bar on card bottom + 'Resume • XXm left' badge in clean monospace metadata.

---

## Antigravity's Discretion

- Choice of numeric font weights and SVG path stroke geometry for outline numerals.
- Exact threshold implementation and debounce handling in `useWatchHistory`.

## Deferred Ideas

- None — discussion stayed within Phase 4 scope.

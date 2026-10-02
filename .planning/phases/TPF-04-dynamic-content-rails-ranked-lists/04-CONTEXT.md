# Phase 04: Dynamic Content Rails & Ranked Lists - Context

**Gathered:** 2026-10-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 4 delivers dynamic, stateful content rails for the TPF Cinemas viewer application (`apps/viewer`). It replaces generic static lists with:
1. **"Continue Watching" Dynamic Rail**: User-specific rail synced to Supabase `watch_history`, displaying in-progress titles with live progress bars, remaining time, instant resume playback, and quick dismissal.
2. **"Top 10 in India" Ranked Rail**: Prominent cinematic rail featuring giant stroked outline rank numerals (1–10) overlapping poster artwork in a high-prestige Netflix style.
3. **Enhanced Rail Navigation**: Responsive smooth-scroll chevrons with boundary auto-hiding/disabling, mobile touch swipe support, and unified watchlist/history synchronization across all rails.

</domain>

<decisions>
## Implementation Decisions

### Top 10 Ranked Rail Visual Style
- **D-01:** Giant stroked outline numerals overlapping the poster left edge — high-impact Netflix style with deep typographic layering and strong visual presence.
- **D-02:** Numerals styled with a metallic silver-to-white stroke, dark semi-transparent fill, and an amber ambient glow on card hover matching the TPF brand theme.
- **D-03:** On hover, rank numerals remain anchored in the rail layer while the poster smoothly lifts and expands into the floating `HoverPreviewPortal`.
- **D-04:** Top 10 titles dynamically ranked by view count and popularity from `useCatalogue`, displayed with the editorial rail title "Top 10 in India".

### Continue Watching Qualification & Dismissal
- **D-05:** Playback threshold for qualification: A film appears in "Continue Watching" only if progress is between 15 seconds (filtering accidental clicks) and 90% completion (treating credits roll as completed).
- **D-06:** An explicit "X" dismiss button on card hover and within the hover preview immediately removes the film from the resume queue and synchronizes to Supabase `watch_history` (setting `completed: true`). — **Reversibility:** costly — Affects `watch_history` schema mutation and hook interfaces.
- **D-07:** Direct instant resume: Clicking Play on any Continue Watching card starts video playback immediately at `progress_seconds`, bypassing intro screens and reflecting the timestamp on the Amber transport HUD.
- **D-08:** Progress bar rendered as a hairline glowing amber bar on the card bottom, accompanied by a clean monospace "Resume • XXm left" status badge.

### Rail Navigation & State Synchronization
- **D-09:** Boundary-aware scroll chevrons that auto-hide when at the extreme start (`scrollLeft === 0`) or end of the scroll container, supporting responsive page-stepping and mobile swipe.
- **D-10:** Universal watchlist state reactivity: Toggling watchlist on any card or portal preview propagates immediately across all displayed rails without page reloads.

### Antigravity's Discretion
- Exact SVG path geometry / font glyphs for the giant 1–10 rank numerals.
- Scroll step calculations (e.g. 80% container width step) and transition spring parameters.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project & Roadmap
- `.planning/PROJECT.md` — Active requirements and core architectural constraints
- `.planning/REQUIREMENTS.md` — Contracts for RAILS-01, RAILS-02, RAILS-03, RAILS-04
- `.planning/ROADMAP.md` — Phase 4 scope, goals, and success criteria

### Existing Components & Hooks
- `apps/viewer/src/components/catalog/ContentRail.tsx` — Base rail component to enhance with boundary chevrons and ranking support
- `apps/viewer/src/components/catalog/FilmCard.tsx` — Card component displaying posters, progress bars, and hover triggers
- `apps/viewer/src/components/catalog/HoverPreviewPortal.tsx` — Floating preview portal receiving rank and dismiss actions
- `apps/viewer/src/hooks/useWatchHistory.ts` — Supabase sync hook for progress tracking and dismiss updates
- `apps/viewer/src/hooks/useCatalogue.ts` — Film catalogue hook providing view metrics and genre splits
- `apps/viewer/src/App.tsx` — Rail hierarchy layout and section assembly

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useWatchHistory`: Already manages `history` map, `getProgress(filmId)`, `recordProgress(filmId, seconds, completed)`. Can be easily extended with a `dismissFromHistory(filmId)` helper.
- `FilmCard`: Already has `progressSeconds` calculation and progress bar DOM; needs an explicit dismiss button overlay and integration with Top 10 rank numeral rendering.
- `ContentRail`: Uses `useRef<HTMLDivElement>` and smooth scrolling; needs scroll listener to track start/end boundaries and conditionally show/hide left and right chevrons.

### Established Patterns
- Motion animations (`framer-motion` / `motion/react`) for smooth spring transitions.
- Zinc/Ivory text palette, Graphite backgrounds, and Amber-500 (`#f59e0b`) signature glowing accents.
- Responsive container `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`.

### Integration Points
- `apps/viewer/src/App.tsx`: Insert `ContinueWatchingRail` right under the Hero billboard when viewer is authenticated, followed by `Top10Rail`, followed by curated genre rails.

</code_context>

<specifics>
## Specific Ideas

- Netflix-style Top 10: Massive numbers (e.g. `text-8xl` or custom SVG glyphs with `-webkit-text-stroke` and drop shadows) positioned behind or overlapping the left third of each poster.
- Seamless resume: One-click playback jumping straight to the exact second in `WatchModal`.

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed strictly within Phase 4 scope.

</deferred>

---

*Phase: 04-Dynamic Content Rails & Ranked Lists*
*Context gathered: 2026-10-02*

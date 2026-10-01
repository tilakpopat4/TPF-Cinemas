# Requirements: TPF Cinemas (Viewer Home Page)

**Defined:** 2026-10-01
**Core Value:** Deliver an immersive, lightning-fast streaming and discovery experience for independent films, where viewers can seamlessly explore, preview, and watch films with zero friction.

## v1 Requirements

Requirements for initial release of the Viewer Home Page.

### Cinematic Hero Billboard

- [x] **HERO-01**: Massive cinematic billboard displaying featured film with video/trailer teaser playback and audio mute/unmute toggle.
- [x] **HERO-02**: Dynamic hero carousel supporting rotating featured titles with subtle cross-fade transitions and backdrop poster loading.
- [x] **HERO-03**: Film metadata badges rendered prominently on hero (Resolution 4K/HD, Age Rating `U`/`UA13+`/`A`, duration, release year, and genre tags).
- [x] **HERO-04**: Primary action buttons: Prominent "Play Now" launching player modal, dynamic "+ My List" watchlist toggle, and "More Info" trigger.

### Netflix-Style Hover Previews

- [x] **HOVER-01**: Smooth hover card expansion on desktop with buffered delay to avoid accidental triggers while scanning.
- [x] **HOVER-02**: Expanded card shows video teaser or backdrop with synopsis preview, runtime, and classification badges.
- [x] **HOVER-03**: Interactive action buttons within expanded card (Quick Play, Watchlist toggle, Like/Reaction, More Info).
- [x] **HOVER-04**: Viewport-boundary awareness ensuring expanded cards on screen edges do not overflow or cause horizontal window scrolling.

### Dynamic Content Rails & Ranked Lists

- [ ] **RAILS-01**: "Continue Watching" rail displaying in-progress titles with visual progress bars calculated from Supabase `watch_history`.
- [ ] **RAILS-02**: "Top 10 / Trending" rail with stylized typography rank numerals (1-10) beside poster artwork.
- [ ] **RAILS-03**: Horizontal scrollable rails for curated categories (Trending, Indie Debuts, Award Winners, Genre rails) with smooth snap scrolling, navigation chevrons, and touch swipe.
- [ ] **RAILS-04**: Realtime synchronisation of watchlist state across cards and hero when toggled.

### Discovery & Category Filtering

- [ ] **FILTER-01**: Sticky filter chips bar allowing quick filtering across film formats (All, Feature Films, Short Films) and Indian languages (Telugu, Hindi, Tamil, Malayalam, Kannada, etc.).
- [ ] **FILTER-02**: Instant responsive filtering and animated transitions between filtered states without page reload.
- [ ] **FILTER-03**: Instant search bar with debounced query filtering across titles, directors, and genres with rich empty-state recommendations.

## v2 Requirements

Deferred to future releases.

### Advanced Viewer Features

- **PLAYER-01**: Adaptive HLS video streaming via Mux with multi-bitrate selection and subtitle/audio track switching.
- **SOCIAL-01**: Shareable deep links with timestamp playback (`/watch/:id?t=120`).
- **PERSONAL-01**: AI-assisted personalized recommendations based on viewing history.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Payment / Subscription gating | Phase 1 focuses on maximum accessibility and zero-egress free launch |
| Native mobile/TV apps | Web portal priority for v1 launch; mobile web is fully responsive |
| In-browser video encoding | Heavy compute avoided; video host CDN handles delivery |

## Traceability

Which phases cover which requirements.

| Requirement | Phase | Status |
|-------------|-------|--------|
| HERO-01 | Phase 1 | Complete |
| HERO-02 | Phase 1 | Complete |
| HERO-03 | Phase 1 | Complete |
| HERO-04 | Phase 1 | Complete |
| HOVER-01 | Phase 2 | Complete |
| HOVER-02 | Phase 2 | Complete |
| HOVER-03 | Phase 2 | Complete |
| HOVER-04 | Phase 2 | Complete |
| RAILS-01 | Phase 3 | Pending |
| RAILS-02 | Phase 3 | Pending |
| RAILS-03 | Phase 3 | Pending |
| RAILS-04 | Phase 3 | Pending |
| FILTER-01 | Phase 4 | Pending |
| FILTER-02 | Phase 4 | Pending |
| FILTER-03 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 15 total
- Mapped to phases: 15
- Unmapped: 0

---
*Requirements defined: 2026-10-01*

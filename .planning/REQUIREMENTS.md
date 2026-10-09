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

- [x] **RAILS-01**: "Continue Watching" rail displaying in-progress titles with visual progress bars calculated from Supabase `watch_history`.
- [x] **RAILS-02**: "Top 10 / Trending" rail with stylized typography rank numerals (1-10) beside poster artwork.
- [x] **RAILS-03**: Horizontal scrollable rails for curated categories (Trending, Indie Debuts, Award Winners, Genre rails) with smooth snap scrolling, navigation chevrons, and touch swipe.
- [x] **RAILS-04**: Realtime synchronisation of watchlist state across cards and hero when toggled.

### Custom Cinematic Video Player

- [x] **PLAYER-01**: Custom Amber-accented video control interface replacing default embed UI with custom interactive scrub bar, buffer display, and hover time preview.
- [x] **PLAYER-02**: Transport controls with glowing amber play/pause, 10s forward/rewind skip, keyboard hotkeys (Space, J, K, L, M, F), and center-screen pulse feedback animations.
- [x] **PLAYER-03**: Interactive volume control with draggable slider, mute toggle, playback speed selector (0.5x - 2.0x), and quality indicators.
- [x] **PLAYER-04**: Unified cinema playback engine supporting chromeless YouTube IFrame API and native HTML5/HLS streams with auto-hiding controls and custom cursor.

### Discovery & Category Filtering

- [ ] **FILTER-01**: Sticky filter chips bar allowing quick filtering across film formats (All, Feature Films, Short Films) and Indian languages (Telugu, Hindi, Tamil, Malayalam, Kannada, etc.).
- [ ] **FILTER-02**: Instant responsive filtering and animated transitions between filtered states without page reload.
- [ ] **FILTER-03**: Instant search bar with debounced query filtering across titles, directors, and genres with rich empty-state recommendations.

### Filmmaker Studio & Submission Pipeline

- [x] **STUDIO-01**: Multi-step submission wizard with real-time validation across title, slug, language, runtime, synopsis, director's note, debut indicator, age rating, genres, and credits.
- [x] **STUDIO-02**: Poster image upload handling and YouTube video ID validation with live test preview screening before submission.
- [x] **STUDIO-03**: Digital non-exclusive licence agreement execution (Schedule A & C, music clearance declaration, terms versioning, record persistence in `licence_agreements`).
- [x] **STUDIO-04**: Creator submission dashboard with status filters (Drafts, In Review, Live), curator feedback review modal, and revision re-submission flow via `submit_film()` RPC.
- [ ] **STUDIO-05**: Post-publish edit workflow — creators can open a published film and submit metadata/media edits via `propose_film_update()` RPC; the live record is unchanged until the update is approved. Creator dashboard shows a "Pending Update" status badge alongside the live film.

### Staff Curation Console & Moderation Queue

- [ ] **STAFF-01**: Live submission review queue with status filtering (`submitted`, `changes_requested`, `approved`, `published`), search, and Supabase realtime subscriptions.
- [ ] **STAFF-02**: Inspection modal featuring an embedded video screening player, full metadata viewer, credits breakdown, and director notes.
- [ ] **STAFF-03**: Curator decision engine executing `review_film()` RPC enforcing mandatory feedback notes for "changes requested" or "rejected", and `verify_licence()` RPC for music clearance confirmation.
- [ ] **STAFF-04**: One-click publishing pipeline via `publish_film()` RPC with status badge synchronization and edge cache invalidation.
- [ ] **STAFF-05**: Pending-update review queue — staff can inspect diff of proposed changes against the live published record, then approve via `apply_film_update()` RPC (merges changes to live) or reject with mandatory feedback notes (notifies creator).

- [ ] **ADMIN-01**: Role management dashboard executing `set_user_role()` RPC to promote/demote users between `viewer`, `filmmaker`, `curator`, and `admin` with self-demote safety checks.
- [ ] **ADMIN-02**: Real-time searchable and filterable platform audit log viewer querying `audit_logs`.
- [ ] **ADMIN-03**: Emergency takedown controls via `takedown_film()` RPC with mandatory reason capture and featured film toggles via `feature_film()` RPC.

### Creator Legal Agreement & Content Rights Framework

- [x] **LEGAL-01**: Creator legal onboarding gate — blocks first-time filmmakers from submitting titles or launching the wizard until they execute the non-exclusive streaming rights grant and IP self-declaration.
- [x] **LEGAL-02**: Dynamic legal deed presentation with interactive vector canvas signature widget, typed legal name attestation, and stroke density validation.
- [x] **LEGAL-03**: Client-side official A4 PDF compilation (`jspdf`) with embedded signature PNG, upload to private `licences` bucket, and permanent dashboard download access.
- [x] **LEGAL-04**: Staff Console Legal Verification tab featuring KPI counters, creator agreement search/filtering, high-res signature inspection, signed PDF download link, and `verify_creator_agreement()` RPC with audit logging.

## v2 Requirements

Deferred to future releases.

### Advanced Platform Features

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
| RAILS-01 | Phase 4 | Complete |
| RAILS-02 | Phase 4 | Complete |
| RAILS-03 | Phase 4 | Complete |
| RAILS-04 | Phase 4 | Complete |
| PLAYER-01 | Phase 3 | Complete |
| PLAYER-02 | Phase 3 | Complete |
| PLAYER-03 | Phase 3 | Complete |
| PLAYER-04 | Phase 3 | Complete |
| FILTER-01 | Phase 5 | Pending |
| FILTER-02 | Phase 5 | Pending |
| FILTER-03 | Phase 5 | Pending |
| STUDIO-01 | Phase 6 | Complete |
| STUDIO-02 | Phase 6 | Complete |
| STUDIO-03 | Phase 6 | Complete |
| STUDIO-04 | Phase 6 | Complete |
| STUDIO-05 | Phase 7 | Pending |
| STAFF-01 | Phase 7 | Pending |
| STAFF-02 | Phase 7 | Pending |
| STAFF-03 | Phase 7 | Pending |
| STAFF-04 | Phase 7 | Pending |
| STAFF-05 | Phase 7 | Pending |
| ADMIN-01 | Phase 8 | Pending |
| ADMIN-02 | Phase 8 | Pending |
| ADMIN-03 | Phase 8 | Pending |
| LEGAL-01 | Phase 9 | Complete |
| LEGAL-02 | Phase 9 | Complete |
| LEGAL-03 | Phase 9 | Complete |
| LEGAL-04 | Phase 9 | Complete |

**Coverage:**
- v1 requirements: 36 total
- Mapped to phases: 36
- Completed: 18
- Pending: 18

---
*Requirements defined: 2026-10-01*
*Updated: 2026-10-09 (Completed Phase 9: LEGAL-01 to LEGAL-04)*

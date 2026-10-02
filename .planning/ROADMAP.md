# Roadmap: TPF Cinemas Platform (Viewer, Studio, Staff & Admin)

## Overview

Deliver a complete cinematic streaming and management ecosystem:
1. **Viewer site (`apps/viewer`)**: High-impact hero billboard, Netflix-style hover previews, custom cinematic video player, dynamic content rails ("Continue Watching", "Top 10"), and sticky discovery filters.
2. **Filmmaker Studio (`apps/studio`)**: Filmmaker onboarding, multi-step submission wizard, media uploads, licence agreements, and submission lifecycle dashboard.
3. **Staff Console (`apps/staff`)**: Curator review queue, film screening inspection, decision engine with mandatory feedback, licence verification, and one-click publishing.
4. **Admin Governance (`apps/staff` admin)**: User role management (RBAC), searchable audit logging, emergency takedowns, and featured catalog curation.

## Phases

- [x] **Phase 1: Cinematic Hero Billboard** - High-impact billboard with video teaser loop, audio mute toggle, rotating featured carousel, and rich metadata badges.
- [x] **Phase 2: Netflix-Style Hover Previews** - Smooth desktop card hover expansion displaying video teaser, synopsis snippet, age rating, and quick actions without layout reflow.
- [x] **Phase 3: Custom Cinematic Video Player** - Custom Amber scrubber, chromeless engine, transport HUD, shortcuts & gestures.
- [x] **Phase 4: Dynamic Content Rails & Ranked Lists** - "Continue Watching" rail with watched-progress bars from `watch_history`, "Top 10 in India" ranked badges, and smooth horizontal scrolling rails.
- [ ] **Phase 5: Discovery Filter Chips & Polish** - Sticky category and language filter bar (Telugu, Hindi, Tamil, Short Films, Feature Films), instant search filtering, and mobile responsive touch polish.
- [x] **Phase 6: Filmmaker Studio & Submission Pipeline** - Creator onboarding, multi-step submission wizard, media uploads & video preview validation, digital licence signing, and submission dashboard with revision tracking.
- [ ] **Phase 7: Staff Curation Console & Moderation Queue** - Realtime submission review queue, screening preview player, curator decision box (`review_film` RPC with mandatory feedback notes), licence verification (`verify_licence` RPC), and one-click publishing (`publish_film` RPC).
- [ ] **Phase 8: Admin Governance, Roles & Audit Logging** - Platform role management (`set_user_role` RPC with self-demote safety checks), searchable real-time audit log stream, and emergency film takedown (`takedown_film` RPC) & featured toggles (`feature_film` RPC).

## Phase Details

### Phase 1: Cinematic Hero Billboard
**Goal**: Deliver a jaw-dropping cinematic hero billboard at the top of the viewer homepage with video teaser preview, sound controls, rotating titles, and primary action CTAs.
**Depends on**: Nothing (first phase)
**Requirements**: HERO-01, HERO-02, HERO-03, HERO-04
**Success Criteria** (what must be TRUE):
  1. Featured film banner displays a seamless background video/teaser playback with a working audio mute/unmute toggle.
  2. Hero displays rich metadata badges (4K/HD, Age Rating `U`/`UA13+`/`A`, release year, runtime, and genre pills).
  3. Clicking "Play Now" launches the full video watch modal; clicking "+ My List" toggles user watchlist state in Supabase.
  4. Hero gracefully rotates featured titles with smooth crossfade animations and provides manual carousel indicators.
**Plans**: 2 plans

Plans:
- [x] 01-01: Build enhanced `HeroBillboard` component with background trailer iframe/video playback, sound controls, and metadata badges.
- [x] 01-02: Connect Hero CTAs to `WatchModal`, `useWatchlist`, and implement carousel rotation between featured titles.

### Phase 2: Netflix-Style Hover Previews
**Goal**: Implement smooth, delayed-hover card expansion showing video teaser snippets, synopsis, and quick-action overlay buttons.
**Depends on**: Phase 1
**Requirements**: HOVER-01, HOVER-02, HOVER-03, HOVER-04
**Success Criteria** (what must be TRUE):
  1. Hovering over any film card on desktop triggers a smooth pop-out expansion after a brief intentional delay (300ms).
  2. Expanded card plays video teaser or shows backdrop with synopsis, runtime, and age rating.
  3. Quick-action buttons (Play, Add to Watchlist, Like, Info) are interactive directly within the expanded card.
  4. Cards near screen edges expand inward to prevent viewport overflow or horizontal scrollbar flicker.
**Plans**: 2 plans

Plans:
- [x] 02-01: Build `HoverPreviewPortal` component and context with Motion spring animations and viewport edge collision detection.
- [x] 02-02: Integrate preview video teaser playback, audio controls, and quick action controls (play, watchlist, like, more info).

### Phase 3: Custom Cinematic Video Player
**Goal**: Design and build our own custom video player engine with the platform's amber/dark cinema color palette, custom scrub bar, transport controls, and chromeless playback.
**Depends on**: Phase 2
**Requirements**: PLAYER-01, PLAYER-02, PLAYER-03, PLAYER-04
**Success Criteria** (what must be TRUE):
  1. Default third-party video player chrome is replaced with our custom designed cinema controls using the amber-500 palette.
  2. Scrubber bar features live playback progress, buffer tracking, drag scrubbing, and hover timestamp tooltips.
  3. Transport HUD includes glowing amber play/pause, 10s forward/rewind, volume slider, playback speed menu (0.5x-2x), and time indicators.
  4. Comprehensive keyboard shortcuts (Space, J, K, L, M, F, I, Esc) and center-screen gesture ripple feedback.
  5. Controls smoothly auto-hide on mouse inactivity with custom cursor states.
**Plans**: 2 plans

Plans:
- [x] 03-01: Build `CinematicPlayer` chromeless engine and custom Amber scrubber with buffer & hover previews.
- [x] 03-02: Build transport HUD controls (play/pause, volume slider, 10s skip, speed selector, keyboard hotkeys & ripples).

### Phase 4: Dynamic Content Rails & Ranked Lists
**Goal**: Build a rich hierarchy of content rails including a personalized "Continue Watching" row and a stylized "Top 10" ranked rail.
**Depends on**: Phase 3
**Requirements**: RAILS-01, RAILS-02, RAILS-03, RAILS-04
**Success Criteria** (what must be TRUE):
  1. "Continue Watching" rail renders only for logged-in users with progress bars showing exact percentage watched from `watch_history`.
  2. "Top 10 in India" rail displays large stylized rank numbers (1-10) beside film posters.
  3. Rails support smooth chevron navigation buttons with auto-hiding at start/end and touch swipe gestures on mobile.
  4. Toggling watchlist in any rail instantly updates card states across all other rails.
**Plans**: 2 plans

Plans:
- [x] 04-01: Create `ContinueWatchingRail` with progress calculation and `Top10Rail` with stylized rank typography.
- [x] 04-02: Enhance `ContentRail` with smooth chevron controls, responsive touch scroll, and synchronized watchlist state.

### Phase 5: Discovery Filter Chips & Polish
**Goal**: Provide instant format and regional language discovery via sticky filter chips, instant search refinement, and responsive mobile adaptations.
**Depends on**: Phase 4
**Requirements**: FILTER-01, FILTER-02, FILTER-03
**Success Criteria** (what must be TRUE):
  1. Sticky filter bar allows single or multi-select filtering across formats (Features, Shorts) and languages (Telugu, Hindi, Tamil, Malayalam, Kannada).
  2. Selecting a filter immediately rearranges rails and catalog items with fluid exit/enter animations.
  3. Search query filters both hero and rail contents with empty-state recommendations if no match is found.
  4. Mobile layout provides bottom navigation drawer and optimized card touch targets.
**Plans**: 2 plans

Plans:
- [ ] 05-01: Build sticky `FilterChipsBar` supporting language/format facets with animated transitions.
- [ ] 05-02: Integrate search query filtering, empty state views, and responsive mobile touch optimizations.

### Phase 6: Filmmaker Studio & Submission Pipeline
**Goal**: Deliver a seamless submission suite for independent filmmakers in `apps/studio` with multi-step wizard, poster uploads, video previews, licence signing, and live status tracking.
**Depends on**: Phase 5
**Requirements**: STUDIO-01, STUDIO-02, STUDIO-03, STUDIO-04
**Success Criteria** (what must be TRUE):
  1. Filmmaker can register/onboard and manage film submissions across draft, review, and live statuses.
  2. Multi-step submission wizard validates title, slug, language, runtime, synopsis, age rating, genres, and credits.
  3. Video URL/ID is validated with real-time screening preview before submission, and poster uploads securely to storage.
  4. Non-exclusive licence terms (Schedule A & C, music clearance declaration) are confirmed and stored in `licence_agreements`.
  5. Submitting calls `submit_film()` RPC, transitioning status to `submitted` and appearing in staff queue.
  6. Filmmaker can view curator feedback on `changes_requested` or `rejected` films and resubmit updated drafts.
**Plans**: 2 plans

Plans:
- [x] 06-01: Build and verify submission wizard steps (metadata, media upload & video preview validation, credits, licence signing).
- [x] 06-02: Connect creator dashboard with status tabs, feedback modal, film stats, and revision re-submission flow.

### Phase 7: Staff Curation Console & Moderation Queue
**Goal**: Empower curators in `apps/staff` to review submitted films, screening playback, verify licences, provide mandatory feedback, and publish approved titles.
**Depends on**: Phase 6
**Requirements**: STAFF-01, STAFF-02, STAFF-03, STAFF-04
**Success Criteria** (what must be TRUE):
  1. Staff dashboard displays live submission queue with realtime status filters (`submitted`, `changes_requested`, `approved`, `published`).
  2. Inspection modal features embedded video player for staff screening alongside complete metadata, credits, and director notes.
  3. Decision engine executes `review_film()` RPC enforcing mandatory feedback notes for "changes requested" or "rejected".
  4. Curators can inspect music clearance and execute `verify_licence()` RPC.
  5. Approved films can be published to the catalog using `publish_film()` RPC with webhook cache invalidation.
**Plans**: 2 plans

Plans:
- [ ] 07-01: Build and verify review queue table, status filters, realtime subscriptions, and screening inspection modal.
- [ ] 07-02: Connect curator decision engine (`review_film`, `verify_licence`, `publish_film` RPCs) with mandatory feedback validation and error handling.

### Phase 8: Admin Governance, Roles & Audit Logging
**Goal**: Provide platform administrators in `apps/staff` with RBAC role management, platform audit logging, and global content controls (takedowns & featured toggles).
**Depends on**: Phase 7
**Requirements**: ADMIN-01, ADMIN-02, ADMIN-03
**Success Criteria** (what must be TRUE):
  1. Admins can view all platform users and promote/demote roles (`viewer`, `filmmaker`, `curator`, `admin`) via `set_user_role()` RPC with self-demote safety checks.
  2. Searchable and filterable audit log stream displays all administrative, curation, and publishing actions from `audit_logs`.
  3. Admins can execute emergency takedowns (`takedown_film()` RPC) with mandatory reasons, archiving the film and clearing edge cache.
  4. Admins can toggle featured film status (`feature_film()` RPC) for hero and spotlight rails.
**Plans**: 2 plans

Plans:
- [ ] 08-01: Implement and verify `RoleManager` dashboard with search, role transitions, and self-demotion guards.
- [ ] 08-02: Implement and verify `AuditLogView` stream, emergency takedown modal, and featured status controls.

---
*Roadmap defined: 2026-10-01*
*Updated: 2026-10-02 (Added Phases 6, 7, 8 for Studio, Staff, Admin portals)*

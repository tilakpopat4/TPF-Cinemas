# Phase 10: Web Series & Episodic Publishing Pipeline - Context & Scope

## Purpose & Strategic Vision
TPF Cinemas currently provides a world-class streaming and creator submission ecosystem for standalone films (Shorts and Feature Films). However, modern independent cinema and digital storytelling increasingly thrive in serialized, episodic formats (anthologies, mini-series, multi-episode web series, documentary series). 

Phase 10 introduces the complete end-to-end **Web Series & Episodic Publishing Pipeline**, allowing creators to submit multi-season, multi-episode series in `apps/studio`, curators to review and approve full seasons or episodes in `apps/staff`, and viewers to seamlessly discover, browse seasons, and binge-watch episodes with automatic next-episode transitions in `apps/viewer`.

---

## Scope & Core Deliverables

### 1. Database & Domain Model (`supabase/migrations/`)
- **`public.series`**: Master entity for the series show (filmmaker_id, title, slug, synopsis, poster_url [2:3], backdrop_url [16:9], language, age_rating, total_seasons, status, published_at, is_featured).
- **`public.seasons`**: Season hierarchy (series_id, season_number, title, synopsis, release_year, poster_url, episode_count).
- **`public.episodes`**: Individual playable units (season_id, series_id, episode_number, title, synopsis, runtime_minutes, video_provider, video_ref, thumbnail_url).
- **`public.series_genres` & `public.series_credits`**: Taxonomy and credit roster (Showrunner, Director, Writer, Executive Producer, Lead Cast).
- **Security & RLS**: Authenticated creator policies, staff curation policies, and public access restricted strictly to published series & episodes.
- **RPC Lifecycle Engine**:
  - `submit_series(p_series_id)`: Validates that the series has at least 1 season with valid playable episodes before entering `submitted` status.
  - `review_series(p_series_id, p_decision, p_notes)`: Enforces staff decisions (`approved`, `changes_requested`, `rejected`) with mandatory feedback logging.
  - `publish_series(p_series_id)`: Atomic one-click publishing of series and all associated episodes.

### 2. Filmmaker Studio Pipeline (`apps/studio`)
- **Series Submission Wizard (`NewSeriesModal` or multi-step wizard)**:
  - **Step 1: Series Bible / Core Metadata**: Title, slug, language, age rating, synopsis, director/showrunner notes, poster (2:3) & backdrop (16:9) artwork upload.
  - **Step 2: Seasons & Episode Manager**: Intuitive builder to add/edit seasons and batch-configure episodes with Episode #, Title, Runtime, Video Link (YouTube ID/URL with live screening preview check), Episode Thumbnail, and Synopsis snippet.
  - **Step 3: Credits & Cast**: Series-level crew (Showrunner, Directors, Writers, Cast).
  - **Step 4: Rights & Clearance**: Confirmation of episodic non-exclusive streaming rights and music clearances under the master legal agreement.
  - **Step 5: Review & Submit**: Pre-submission audit check and validation before calling `submit_series()`.
- **Creator Dashboard**:
  - Filter toggle or tab between **Films** and **Series**.
  - Series card displaying season count, episode count, poster, and live status badge (`draft`, `submitted`, `published`, etc.).

### 3. Staff Curation Console (`apps/staff`)
- **Series Moderation Queue**:
  - Dedicated queue filter / view for submitted series.
  - Real-time status badges and submission timestamps.
- **Series Inspection Modal**:
  - Interactive season/episode tree navigator.
  - Embedded screening player allowing curators to spot-check or watch any episode directly within the inspection modal.
  - Episode clearance and link validity badges.
  - Curator decision engine (`review_series`, `publish_series`) with mandatory feedback notes and audit log recording.

### 4. Viewer Streaming & Binge-Watching Experience (`apps/viewer`)
- **Discovery Rails**:
  - "Original Web Series" content rail on the homepage.
  - Series cards with distinctive badges (`SERIES • 2 SEASONS` / `N EPISODES`).
- **Series Detail View & Episode Browser**:
  - Season selector dropdown/tabs (`Season 1`, `Season 2`).
  - Episode list with episode thumbnails, duration, episode title, synopsis, and instant play trigger.
- **Episodic Video Player Navigation**:
  - Smooth integration with custom `CinematicPlayer`.
  - Next Episode prompt / countdown overlay when an episode reaches 95% completion or ends.
  - In-player "Episodes" quick drawer/menu to switch episodes without leaving playback.
  - Per-episode progress syncing to user `watch_history`.

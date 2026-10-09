# Phase 10: Web Series & Episodic Publishing Pipeline - Research & Architecture

## Technical Analysis & Patterns

### 1. Relational Model vs. Flat Films
- **Problem**: The current platform is strictly 1:1 (`film` = 1 `video_ref`, 1 runtime, 1 set of credits).
- **Solution**: A canonical 3-tier hierarchy:
  - **`series`**: The overarching show entity. Has title, synopsis, poster (2:3), backdrop (16:9), genres, language, maturity rating, and lifecycle status (`draft`, `submitted`, `approved`, `published`, `changes_requested`, `rejected`).
  - **`seasons`**: Logical groupings of episodes. Has `season_number` (1, 2, ...), title, optional synopsis, release year.
  - **`episodes`**: The atomic playable entity. Has `episode_number` (1, 2, ...), title, synopsis, `runtime_minutes`, `video_provider` ('youtube'), `video_ref` (YouTube ID), and `thumbnail_url`.
- **Integrity Constraints**:
  - `unique(series_id, season_number)` ensures unique numbering per series.
  - `unique(season_id, episode_number)` ensures unique episode numbers per season.
  - Cascade deletes: Deleting a draft series cascades cleanly to its seasons and episodes.

### 2. Episodic Playback & Video Engine Integration
- **Custom Cinematic Player Compatibility**:
  - The `CinematicPlayer` component accepts `videoRef`, `title`, `posterUrl`, and custom controls.
  - When playing an episode, we pass the episode's title, episode number context (e.g. `S1:E3 • The Reunion`), and the series title as super-title.
  - **Auto-Advance / Next Episode**:
    - When video reaches 95% completion or triggers ended state, a floating countdown banner appears: *"Next Episode in 5... [Play Now] [Cancel]"*.
    - Clicking "Play Now" smoothly loads the subsequent episode in-place without unmounting the player modal.
  - **In-Player Episode Drawer**:
    - An "Episodes" icon in the player HUD allows users to browse all episodes in the current season and jump between them on the fly.

### 3. Filmmaker Studio Workflow Ergonomics
- **The Multi-Episode Challenge**:
  - Submitting 6-10 episodes individually through separate pages is tedious and error-prone.
  - **Wizard Solution**:
    - **Step 1**: Series Profile (Show title, slug, language, age rating, synopsis, 2:3 poster, 16:9 backdrop).
    - **Step 2**: Season & Episode Builder:
      - Default to "Season 1" with an "Add Season" option.
      - Within each season, quick-add cards for episodes: Episode Number, Title, Runtime (mins), YouTube Link (with auto-extraction of ID & instant preview thumbnail), and 1-2 sentence synopsis.
    - **Step 3**: Series Credits & Cast (Showrunner, Director, Lead Cast).
    - **Step 4**: Legal Rights & Music Clearance declaration.
    - **Step 5**: Comprehensive Pre-Submission Audit.

### 4. Staff Curation & Moderation Queue
- **Curation Workflow**:
  - Curators need to verify that:
    1. The series premise and synopsis meet quality and community guidelines.
    2. Episode videos are valid, unblocked, and playable.
    3. Music/copyright clearance is declared for all episodes.
  - The Review Modal provides an interactive episode tree where clicking any episode loads it into the screening player for instant spot-checking.
  - Decision options:
    - **Approve**: Marks series approved.
    - **Request Changes**: Mandatory notes explaining what needs updating (e.g. "Episode 2 video link is private, please update").
    - **Reject**: Enforces rejection reason.
    - **1-Click Publish**: Publishes the series to the live catalog.

### 5. Watchlist & Watch Progress Tracking
- **Watch History**:
  - Table `episode_watch_history`: tracks progress per `(user_id, episode_id)` with `series_id` foreign key.
  - "Continue Watching" on the viewer homepage can surface the latest in-progress episode for any series, showing progress bar and *"S1:E2 • 14m left"*.
- **Watchlist**:
  - Table `series_watchlist`: tracks series saved to user's list.

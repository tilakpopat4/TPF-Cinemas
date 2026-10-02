# Phase 6: Filmmaker Studio & Submission Pipeline - Research

## Domain & Architecture Overview

`apps/studio` is the dedicated self-serve portal for independent filmmakers to draft, configure, license, and submit their films to the TPF Cinemas curation queue.

### Core Systems

1. **RBAC & Filmmaker Onboarding**:
   - Every signed-up user begins with the `viewer` role in `profiles`.
   - Any signed-in user can self-promote to `filmmaker` via `public.become_filmmaker()` Postgres RPC.
   - The Studio header and route guards check `profile.role in ('filmmaker', 'admin')`. Viewers see `OnboardingBanner` prompting them to unlock the filmmaker dashboard.

2. **Film Submission Lifecycle**:
   - Initial state: `draft`
   - Transition to `submitted` via `public.submit_film(p_film_id uuid)` RPC.
   - Database checks in `submit_film()`:
     - `filmmaker_id == auth.uid()`
     - Current status is `draft` or `changes_requested`
     - `video_ref` is present (YouTube video ID)
     - `poster_url` is present (uploaded artwork)
     - `licence_agreements` record exists for this `film_id`
   - Curation outcomes:
     - If curator approves: status becomes `approved`, then `published`.
     - If curator requests changes: status becomes `changes_requested`, curator feedback notes recorded in `film_reviews`, filmmaker can edit and resubmit.
     - If curator rejects: status becomes `rejected` with mandatory notes.

3. **Multi-Step Submission Wizard (`FilmEditorModal`)**:
   - **Step 1: Film Metadata (`StepDetails`)**: Title (max 120), slug (auto-slugified, regex `^[a-z0-9]+(-[a-z0-9]+)*$`), synopsis (max 1500), director's note (max 1500), runtime (1–240 mins), language (Indian regional facets), release year (1990–2100), age rating (`U`, `UA7+`, `UA13+`, `UA16+`, `A`), debut film flag (`is_debut`).
   - **Step 2: Media & Streams (`StepMedia`)**:
     - Poster upload to Supabase storage bucket `posters` with file size validation (<5MB), MIME verification (JPEG, PNG, WebP), path sanitization (`${userId}/${Date.now()}_${name}`), and upload progress simulation.
     - YouTube embed video link input with `extractYouTubeId` regex parsing and test screening preview player (`youtube-nocookie.com/embed/...`).
   - **Step 3: Genres & Credits (`StepCredits`)**:
     - Primary genres (up to 3) linked to `film_genres` table.
     - Cast & crew credits (Name, Role, Sort Order) linked to `film_credits` table.
   - **Step 4: Legal Licence (`StepLicence`)**:
     - Non-exclusive licence terms (Schedule A & C).
     - Territory (`worldwide`).
     - Duration (12, 24, 36, 60 months).
     - Mandatory music clearance declaration checkbox (`music_cleared`).
     - Terms version (`v1.0`).

4. **Creator Dashboard & Realtime Updates**:
   - Status filters: `All`, `Drafts & Revisions`, `In Review`, `Live`.
   - `StatsOverview`: Live counts of total, drafts, under review, and published films.
   - Realtime Supabase channel on `films` (filtered by `filmmaker_id=eq.${userId}`) and `film_reviews` to alert filmmakers the instant a curator reviews their submission.
   - `FeedbackModal`: Displays curator notes and instructions with direct "Edit & Resubmit Film" action.

## Validation Architecture

1. **Build & Type Check**:
   - `npm run build` in `apps/studio` compiles TypeScript and runs Vite production bundling with zero errors.
2. **Schema & RPC Validation**:
   - `submit_film()` RPC enforces mandatory fields and state preconditions.
   - `become_filmmaker()` RPC allows viewers to self-promote.
3. **Form Integrity**:
   - Realtime client-side validation prevents advancing steps or submitting incomplete forms.
   - Music clearance declaration is mandatory before submission.

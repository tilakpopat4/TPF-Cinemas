# Phase 6: Filmmaker Studio & Submission Pipeline - Validation Strategy

## Test Plan & Verification Criteria

### 1. Automated Verification
- **Type Checking & Bundling**:
  Run `npm run build` in `apps/studio` (`cd apps/studio && npm run build`).
  Ensure zero TypeScript compilation errors and successful production artifact generation.

### 2. Manual & Functional Verification
- **STUDIO-01 (Multi-Step Submission Wizard)**:
  - Verify all 4 steps render correctly in `FilmEditorModal`.
  - Step 1: Ensure required fields (Title, Slug, Synopsis, Runtime, Language) validate before allowing step progress.
  - Step 2: Ensure poster upload accepts JPG/PNG/WebP under 5MB and displays upload progress; ensure YouTube URL correctly parses video ID.
  - Step 3: Ensure genre selector limits to 3 genres; ensure cast & crew credits can be added, edited, and reordered.
  - Step 4: Ensure music clearance checkbox is strictly required to complete the submission.
- **STUDIO-02 (Media & Stream Handling)**:
  - Test poster replacement and preview display.
  - Test YouTube video embedding in test player preview before saving.
- **STUDIO-03 (Digital Licence Signing)**:
  - Verify `licence_agreements` row creation with selected term duration and `music_cleared: true`.
- **STUDIO-04 (Creator Dashboard & Revisions)**:
  - Verify filter tabs (`All`, `Drafts`, `In Review`, `Live`).
  - Verify `FeedbackModal` pops up when clicking "View Feedback" on films with status `changes_requested` or `rejected`.
  - Verify "Edit & Resubmit Film" button re-opens the editor modal with existing film data and triggers `submit_film()` RPC on submit.

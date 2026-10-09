# Phase 9: Creator Legal Agreement & Content Rights Framework - Research

## Domain & Architecture Overview

Phase 9 establishes the formal legal agreement and intellectual property (IP) framework for independent creators on TPF Cinemas. Before a creator can submit their first title for curation and streaming, they execute a binding digital deed granting TPF Cinemas non-exclusive streaming rights and self-declaring complete IP and chain-of-title ownership (including musical and audio sync clearance).

### Core Objectives
1. **Creator Onboarding Gate (`apps/studio`)**: Intercept first-time filmmakers navigating to "New Film" or creator submission portals. Check if an executed `licence_agreements` record exists for their `user_id`. If not, mandate execution before proceeding.
2. **Dynamic Deed & Clauses**: Dynamic legal terms based on film type (Short Film vs. Feature Film), presenting non-exclusive worldwide distribution, term duration, festival preservation, and self-declaration indemnification.
3. **Canvas Digital Signature & Biometrics**: HTML5 interactive canvas allowing creators to draw smooth vector signatures (touch & pointer events), accompanied by a typed full legal name confirmation and client/server-recorded execution metadata (timestamp, user agent, IP).
4. **Authoritative Client PDF Generation & Storage**: Generate an official OTT Deed PDF client-side (via `jspdf`), embed the signature PNG and formal letterhead, upload to the private `licences` Supabase Storage bucket, and provide instant download capability.
5. **Staff Legal Verification Console (`apps/staff`)**: Dedicated "Legal Verification" tab in Staff Console allowing administrators to review signed deeds, preview signatures, download archived PDFs, and execute verification RPCs with immutable audit logs.
6. **Immutable Legal Records**: Migration extending `licence_agreements` so legal records survive account deactivation or film archival for platform liability protection.

---

## Technical Architecture & Implementation Strategy

### 1. Database Schema Extension & RLS

#### Schema Enhancements
Existing `licence_agreements` in `20260920000001_init_schema.sql` binds strictly to `film_id` (`not null unique references public.films (id)`). To support creator-level onboarding deeds that precede film submission:
- Make `film_id` optional (`DROP NOT NULL`) to allow creator-level master agreements.
- Add unique constraint on `(filmmaker_id) WHERE film_id IS NULL` for creator-level master onboarding agreements.
- Retain cascade protection: change `ON DELETE CASCADE` to `ON DELETE SET NULL` on `film_id` so agreements remain legally permanent even if a film record is purged.
- Add columns:
  - `signature_image_url text` (path inside `licences` bucket)
  - `agreement_pdf_url text` (path inside `licences` bucket)
  - `signed_ip text` (IP address of signer)
  - `signed_user_agent text` (browser user agent)
  - `agreement_version text not null default '1.0.0'`
  - `film_type_at_signing text check (film_type_at_signing in ('short', 'feature', 'all'))`
  - `legal_name text` (typed legal name of signer)

#### New Migration: `20261009000001_creator_legal_agreements.sql`
- Alters `licence_agreements` table columns and foreign keys.
- Creates `verify_creator_agreement(p_agreement_id uuid)` RPC for Staff Console legal verification.
- Adds RLS policies ensuring creators can query their own agreements, while staff/admin roles can query all agreements.

---

### 2. Client-Side PDF Generation (`jspdf`)

#### Library Evaluation
- `jspdf` provides lightweight, reliable client-side PDF document construction in modern browser environments without requiring headless Chromium or server-side render egress.
- Integrates seamlessly with Vite, React 18, and TypeScript:
  ```bash
  npm i jspdf --workspace=@tpf/studio
  ```
- Generates standard A4 PDF pages with customized typography, headers, margins, horizontal rules, page numbering, embedded PNG signature (`doc.addImage`), and produces a binary `Blob` ready for `supabase.storage.from('licences').upload(...)`.

#### Storage Pattern
- Bucket: `licences` (already configured in Supabase as private, 10MB limit, allowed MIME types: `application/pdf`, `image/png`, `image/jpeg`).
- Folder structure: `${filmmaker_id}/master_deed_${timestamp}.pdf` and `${filmmaker_id}/signature_${timestamp}.png`.
- Access pattern: Signed URLs (`supabase.storage.from('licences').createSignedUrl(path, 3600)`) generated on demand for creator dashboard download and staff console inspection.

---

### 3. Interactive Canvas Signature Pad

#### Component: `SignaturePad.tsx`
- HTML5 `<canvas>` with device pixel ratio scaling (`window.devicePixelRatio`) to ensure sharp rendering on retina displays.
- Pointer event listeners (`pointerdown`, `pointermove`, `pointerup`, `pointerleave`) supporting mouse, touch stylus, and finger gestures.
- Stroke interpolation with `lineCap = 'round'` and `lineJoin = 'round'`, utilizing dark ink on parchment background or crisp white/amber for UI preview, exported as clean PNG data URL via `canvas.toDataURL('image/png')`.
- Empty canvas guard: stroke counter / bounding box validation to prevent signing blank canvases.
- Actions: "Clear Signature", "Undo Stroke".

---

### 4. Studio Onboarding Flow (`apps/studio`)

#### User Experience
1. **Hook `useCreatorAgreement(userId)`**: Queries Supabase for an existing signed `licence_agreements` row for the logged-in filmmaker.
2. **Onboarding Guard**: In `apps/studio/src/App.tsx`, when filmmaker clicks "New Film" or attempts submission:
   - If unsigned: launches `LegalOnboardingModal.tsx`.
   - If signed: proceeds directly to film editor wizard.
3. **Dashboard Access**: Studio dashboard header / profile menu displays a badge "Legal Rights Executed (v1.0)" with a button "Download Signed Agreement" that opens/downloads the authoritative PDF.

---

### 5. Staff Console: Legal Verification Tab (`apps/staff`)

#### Component: `LegalVerificationTab.tsx`
- Added to `StaffHeader.tsx` as a new top-level tab "Legal Verification" (curator/admin visible).
- Features:
  - KPI overview: Total Agreements, Verified Deeds, Pending Review.
  - Searchable, filterable list of filmmakers with status pill (`Signed`, `Verified`, `Unsigned`).
  - Agreement inspection modal/drawer:
    - Filmmaker details (legal name, account email, signing timestamp, IP address, user agent).
    - Signature preview image rendered from private storage via signed URL.
    - "Download Official PDF" button.
    - "Verify Agreement" action executing `verify_creator_agreement` RPC and creating an entry in `audit_log`.

---

## Validation Architecture

### 1. Automated Verification
- **Studio Build**: `npm run build --workspace=@tpf/studio` (ensures TypeScript types, `jspdf` bundling, and components compile cleanly).
- **Staff Build**: `npm run build --workspace=@tpf/staff` (verifies tab integration and inspection components).

### 2. Functional & Manual Acceptance Criteria
- **LEGAL-01 (Creator Legal Onboarding Gate)**: First-time filmmaker cannot open film creation wizard without executing deed.
- **LEGAL-02 (Dynamic Agreement Clauses & Signature Pad)**: Modal displays dynamic legal clauses, interactive signature pad enforces non-blank stroke input and typed legal name match.
- **LEGAL-03 (PDF Generation & Storage)**: Signed agreement PDF is generated client-side, uploaded to `licences` storage bucket, and immediately downloadable.
- **LEGAL-04 (Staff Legal Verification Tab)**: Staff Console displays agreement details, preview signature, download link, and verified status with audit log recording.

# Phase 9: Creator Legal Agreement & Content Rights Framework - Context

**Gathered:** 2026-10-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a legally sound creator digital agreement system. Covers:
1. A one-time onboarding legal gate that blocks first-time creators from submitting any film until they sign the agreement.
2. Dynamic agreement document (Short Film vs Feature Film variant) covering non-exclusive streaming rights grant + IP ownership self-declaration.
3. Canvas signature widget + typed full legal name — generating both a raw signature image AND a signed PDF stored in Supabase Storage.
4. Creator-accessible signed PDF download from their Studio dashboard at any time.
5. A dedicated "Legal Verification" tab in the Staff Console for admins to inspect, preview, and formally verify creator agreements.
6. Immutable `licence_agreements` records — never deleted even on film takedown or account deletion.

**Out of scope for this phase:**
- Aadhaar e-sign / DSC integration (external API, not needed now)
- Mandatory supporting document uploads from creators (NOCs, chain-of-title — self-declaration is sufficient)
- Per-film re-signing (agreement is one-time per creator; all films reference it unless terms change)
- Legal counsel review of agreement text (platform owner is responsible for that offline)

</domain>

<decisions>
## Implementation Decisions

### Document Scope
- **D-01:** Two core documents only — **Non-Exclusive Streaming Rights Grant** + **IP Ownership Self-Declaration**. Music clearance is covered within the IP ownership declaration as a sub-clause (not a separate document). — **Reversibility:** costly — adding more document types later would require re-sign flows for existing creators.
- **D-02:** Agreement text uses **dynamic clauses** — Short Film and Feature Film variants have different language (e.g., exclusivity scope, duration language, credits requirements). Film type is determined by the `duration` field at time of signing. — **Reversibility:** reversible — clause text can be updated, new `agreement_version` issued.

### Document Presentation
- **D-03:** **In-page HTML render** for reading + **downloadable PDF copy** generated after signing. In-page view uses the platform's dark cinema aesthetic with clear section headings and numbered clauses the creator scrolls through before the signature widget appears. — **Reversibility:** reversible — PDF generation library can be swapped.
- **D-04:** PDF is generated client-side using a library (e.g., `jspdf`) with the canvas signature image embedded. The PDF is then uploaded to Supabase Storage, not re-generated on every download — the stored PDF is the authoritative signed record.

### Signature Mechanism
- **D-05:** **Drawn canvas signature** (finger/mouse draw) + **typed full legal name** confirmation. Both are required — the typed name acts as a cross-check against the account name. — **Reversibility:** one-way — the signature format (canvas blob) is embedded in the generated PDF; changing to a different format would invalidate existing signatures visually.
- **D-06:** Server-side metadata recorded at signing: `user_id`, `film_id` (null for onboarding — agreement is creator-level not film-level), `signed_at` (UTC timestamp), `signed_ip` (from Cloudflare worker header or Supabase Edge Function), `signed_user_agent`, `agreement_version` (semver string e.g. `"1.0.0"`), `film_type_at_signing` (`"short"` or `"feature"`).
- **D-07:** Signature is stored as a **PNG image** in `supabase/storage/signatures/` bucket (private, signed URLs for access) and embedded in the PDF. Both `signature_image_url` and `agreement_pdf_url` columns added to `licence_agreements`.

### Signature Timing
- **D-08:** **One-time onboarding flow** — triggered the FIRST time a creator clicks "New Film" or navigates to any submission flow, before the wizard opens. Supabase checks if `licence_agreements` row exists for the `user_id` (with `signed_at IS NOT NULL`). If yes → skip straight to wizard. If no → show legal gate. — **Reversibility:** costly — changing to per-film signing later requires a data migration and UX re-design.
- **D-09:** If platform updates agreement terms (new `agreement_version`), creators who have signed an older version are prompted once on next login to re-sign before accessing Studio features.

### Verification — Staff Side
- **D-10:** **Self-declaration only** — the platform trusts the creator's signed declaration. No mandatory document uploads required. This follows the standard practice of Indian indie streaming platforms (platform not liable if creator provided false information). Legal risk disclosure is embedded in the agreement text.
- **D-11:** Staff Console gets a dedicated **"Legal Verification" tab** (admin-only, alongside existing Queue / Roles / Audit tabs). It shows: a searchable list of all creators with agreement status badge (✅ Signed / ⚠ Unsigned / 🔄 Re-sign Required), creator name, signing date, agreement version, film type. Clicking a row opens a detail panel with: signature image preview, PDF download link, and a "Verify & Log" button that calls `verify_licence()` RPC and writes to `audit_logs`.

### Retention & Access
- **D-12:** Supabase Storage (lifetime of platform) + `licence_agreements` row — **NEVER deleted**, even on film takedown or account deletion. The signed agreement is legal evidence that TPF acted in good faith. Soft-delete only on account deletion: `deleted_at` timestamp on the profile, agreement row remains.
- **D-13:** Access control: **Creator themselves** (can always download their own signed PDF via signed URL from Studio dashboard) + **Admin role only** (can view all agreements via the Legal Verification tab). Curator/staff role cannot access agreement details — only admins can.

### the agent's Discretion
- PDF styling: match the platform's dark cinema aesthetic (dark background, amber accents, TPF Cinemas header). Keep it professional — this is a legal document.
- Canvas signature widget: clear/reset button, responsive (works on mobile touch), white background with dark ink on the canvas for legibility in the PDF.
- Empty canvas guard: reject submission if canvas is blank or below a minimum stroke count threshold.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Legal Infrastructure (Phase 6)
- `.planning/phases/TPF-06-filmmaker-studio-submission-pipeline/06-01-PLAN.md` — Existing submission wizard structure; Legal Agreement step is Step 4 in the wizard
- `.planning/phases/TPF-06-filmmaker-studio-submission-pipeline/06-01-SUMMARY.md` — What was built: `StepLicence.tsx`, `licence_agreements` table structure, `submit_film()` RPC
- `apps/studio/src/components/editor/StepLicence.tsx` — Existing licence step to REPLACE/EXTEND with canvas signature flow
- `supabase/migrations/` — Existing migration files; new migration needed to ADD columns to `licence_agreements`

### Database Schema
- `tpf_cinemas_schema.sql` — Full schema; `licence_agreements` table is the primary target for extension

### Staff Console (Phase 7 integration point)
- `.planning/phases/TPF-07-staff-curation-console-moderation-queue/` — Phase 7 plan (when written) defines the Staff Console tab structure; Phase 9's Legal Verification tab must slot alongside Phase 7's tabs
- `apps/staff/src/components/layout/StaffHeader.tsx` — Staff tab navigation; new "Legal" tab to be added here

### Platform Architecture
- `apps/studio/src/App.tsx` — Studio entry point; onboarding gate logic belongs here (before any route is accessible)
- `apps/studio/src/hooks/` — Pattern for Supabase data hooks; `useLicenceStatus` hook needed

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/studio/src/components/editor/StepLicence.tsx` — Existing licence checkbox step; to be replaced by the full canvas signature + PDF flow (the checkbox confirmation pattern can be kept as a secondary "I agree" confirmation after signing)
- `apps/studio/src/components/editor/FilmEditorModal.tsx` — Multi-step wizard shell; Phase 9 does NOT add a new wizard step (agreement is pre-wizard onboarding gate, not a wizard step inside the film submission)
- `apps/staff/src/components/layout/StaffHeader.tsx` — Tab navigation for Staff Console; Legal Verification tab joins the existing Queue / Roles / Audit tabs
- `apps/staff/src/components/queue/ReviewModal.tsx` — Modal pattern for the staff detail view; Legal Verification detail panel can reuse the same modal pattern

### Established Patterns
- Supabase Storage: already used for poster uploads in Phase 6 (`supabase.storage.from('posters').upload(...)`). Same pattern applies for `signatures` and `agreements` buckets.
- RPC calls: `review_film()`, `verify_licence()`, `publish_film()` pattern already established — `verify_licence()` RPC exists and will be EXTENDED (or a new `record_legal_verification()` RPC added) to log legal tab verification actions.
- Supabase RLS: `licence_agreements` table must have RLS policies allowing creator to read own row, admin to read all rows.
- Audit logging: `audit_logs` table already in schema — legal verification action must write here.

### Integration Points
- **Studio onboarding gate:** `apps/studio/src/App.tsx` → check `licence_agreements` for current user before rendering any studio route → redirect to `<LegalOnboardingModal>` if unsigned.
- **`licence_agreements` table extension:** new migration adds `signature_image_url`, `agreement_pdf_url`, `signed_ip`, `signed_user_agent`, `agreement_version`, `film_type_at_signing` columns.
- **Staff Console:** new "Legal" tab alongside existing tabs in `StaffHeader.tsx`; new `LegalVerificationTab.tsx` component.
- **PDF generation:** `jspdf` library (or `pdf-lib`) used client-side to compose the document, embed the canvas PNG, upload the result to Supabase Storage.

</code_context>

<specifics>
## Specific Ideas

- The canvas signature widget should look visually impressive: dark background, amber/gold ink, smooth strokes. The creator should feel like they're "officially signing" something important — this is a trust moment.
- Agreement PDF should have a TPF Cinemas header with the logo, the creator's full name and email, signing date/time, IP address (masked last octet for privacy), and the typed name as a "I, [Full Name], hereby agree..." footer above the signature image.
- Agreement version field (`"1.0.0"`) allows future re-sign prompts when terms change without re-engineering the flow.
- The "Legal Verification" tab in Staff Console should have a calm, professional aesthetic — distinct from the high-energy queue view. Think: clean table, muted colors, legal/document iconography.

</specifics>

<deferred>
## Deferred Ideas

- **Aadhaar e-Sign / DSC integration** — Highest legal weight but requires external API, Aadhaar-linked mobile, and costs money. Defer to a future compliance phase if needed.
- **Per-film re-signing** — User confirmed one-time onboarding is preferred. Per-film signing would be a different model entirely.
- **Mandatory supporting document uploads** (NOCs, chain-of-title, music clearance certs as files) — Deferred in favor of self-declaration. If the platform grows and abuse becomes a pattern, this can be added as a Tier-2 requirement phase.
- **Copyright dispute resolution flow** — A creator receives a copyright claim → they can respond → staff arbitrates. Complex workflow, separate phase.
- **Multi-language agreement text** (Telugu, Hindi, Tamil versions of the agreement) — Deferred; English agreement is legally sufficient for now. Translator note to be added to the in-page view.

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 9-Creator Legal Agreement & Content Rights Framework*
*Context gathered: 2026-10-02*

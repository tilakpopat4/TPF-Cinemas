---
phase: "09"
slug: "creator-legal-agreement-content-rights"
status: draft
shadcn_initialized: false
preset: none
created: "2026-10-09"
---

# Phase 09 — UI Design Contract

> Visual and interaction contract for Phase 9: Creator Legal Agreement & Content Rights Framework.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none |
| Preset | not applicable |
| Component library | none (custom React components with Tailwind CSS) |
| Icon library | lucide-react |
| Font | font-sans (Inter/system), font-serif (legal parchment), font-mono (codes & timestamps) |

---

## Spacing Scale

Declared values (multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, badge padding |
| sm | 8px | Button inline gaps, input inner padding |
| md | 16px | Form element separation, modal headers |
| lg | 24px | Section padding in modals |
| xl | 32px | Document margins, table padding |
| 2xl | 48px | Drawer breaks |
| 3xl | 64px | Full-page views |

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 14px / text-sm | 400 (normal) | 1.6 / relaxed |
| Legal Clause | 13px / text-[13px] | 400 (normal) | 1.7 / leading-loose |
| Label | 12px / text-xs | 600 (semibold) | 1.4 |
| Heading | 18px / text-lg | 700 (bold) | 1.3 |
| Display | 24px / text-2xl | 800 (extrabold) | 1.2 |

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#08090c` (canvas), `#0c0d14` (card/modal surface) | Backgrounds, overlay sheets |
| Secondary (30%) | `#13151f`, `#1b1e2e` | Parchment borders, card backgrounds, table rows |
| Accent (10%) | `#e5a93b` / amber-500 (`bg-signature`, `text-signature`) | Primary CTAs, active badges, signature ink |
| Destructive | `#ef4444` / rose-500 | Clear signature, cancel actions |
| Success | `#10b981` / emerald-500 | Verified badges, confirmation icons |

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Onboarding Gate CTA | "Review & Sign Rights Agreement" |
| Signature Clear Button | "Clear Signature" |
| Signature Confirm CTA | "Digitally Sign & Execute Deed" |
| Empty signature error | "Please provide your drawn digital signature before confirming." |
| Name mismatch error | "Legal name is required and must match your verified identity." |
| Download CTA | "Download Official PDF Copy" |
| Staff Verification Action | "Verify & Approve Agreement" |

---

## UI Considerations

| Category | Element(s) | Status | Resolution / Reason |
|----------|------------|--------|---------------------|
| Canvas Touch | `SignaturePad` | ✅ covered | Prevents default scrolling on canvas touch to allow smooth drawing |
| Document View | `LegalAgreementDoc` | ✅ covered | Scrollable inner deed body with scroll-to-bottom indicator before signature activates |
| Staff Verification | `LegalVerificationTab` | ✅ covered | Searchable table with instant status filters (`All`, `Signed`, `Verified`, `Unsigned`) |
| PDF Download | Studio & Staff | ✅ covered | Instant client-side download via signed Supabase Storage URL |

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS
- [x] Dimension 7 Inventory Provenance: PASS

**Approval:** approved 2026-10-09

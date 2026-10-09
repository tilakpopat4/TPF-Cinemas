---
phase: "09"
slug: "creator-legal-agreement-content-rights"
status: draft
nyquist_compliant: true
wave_0_complete: false
created: "2026-10-09"
---

# Phase 09 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | TypeScript compiler (`tsc`) + Vite production bundler |
| **Config file** | `apps/studio/tsconfig.json`, `apps/staff/tsconfig.json` |
| **Quick run command** | `npm run build --workspace=@tpf/studio` |
| **Full suite command** | `npm run build --workspace=@tpf/studio && npm run build --workspace=@tpf/staff` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build --workspace=@tpf/studio` (or `@tpf/staff` depending on task target)
- **After every plan wave:** Run `npm run build --workspace=@tpf/studio && npm run build --workspace=@tpf/staff`
- **Before `/gsd-verify-work`:** Full suite must compile cleanly with zero errors
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 1 | LEGAL-01 | T-09-01 | Creator agreement table extension & RLS policies prevent tampering | migration | `npm run build --workspace=@tpf/studio` | ✅ | ⬜ pending |
| 09-01-02 | 01 | 1 | LEGAL-02 | T-09-02 | Canvas signature widget validates stroke density before signing | build | `npm run build --workspace=@tpf/studio` | ✅ | ⬜ pending |
| 09-01-03 | 01 | 2 | LEGAL-03 | T-09-03 | PDF generated client-side and saved to private storage bucket | build | `npm run build --workspace=@tpf/studio` | ✅ | ⬜ pending |
| 09-02-01 | 02 | 1 | LEGAL-04 | T-09-04 | Legal verification tab in Staff Console with audit logging | build | `npm run build --workspace=@tpf/staff` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] Existing infrastructure (`npm run build`) covers all type and compilation requirements.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| First-time onboarding intercept | LEGAL-01 | Modal trigger depends on creator auth state | Sign in as filmmaker without agreement; click "New Film"; verify `LegalOnboardingModal` displays before wizard. |
| Smooth canvas drawing & validation | LEGAL-02 | Canvas interaction involves touch/pointer gestures | Draw signature; click clear; test empty submission rejection; verify typed legal name cross-check. |
| PDF download and storage integrity | LEGAL-03 | Visual layout and binary blob storage | Complete signing; click "Download Signed Copy"; verify PDF displays official TPF letterhead and signature image. |
| Staff Console Legal Verification | LEGAL-04 | Curator UI inspection workflow | Open Staff Console -> Legal Verification tab; verify creator entry, preview signature image, click "Verify Agreement", check audit log entry. |

---

## Validation Sign-Off

- [x] All tasks have automated compile/type verification
- [x] Sampling continuity: builds executed after each wave
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

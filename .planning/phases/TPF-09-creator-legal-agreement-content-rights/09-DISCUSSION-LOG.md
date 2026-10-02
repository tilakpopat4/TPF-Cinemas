# Phase 9 Discussion Log

**Phase:** 9 — Creator Legal Agreement & Content Rights Framework
**Discussion date:** 2026-10-02
**Areas discussed:** 4 of 4

---

## Area 1: Document Scope & Format

**Q1:** Which legal documents must the creator sign/agree to at submission time?
- Options presented: Full suite (5 docs) / Two core docs / Streaming rights only
- **Selected:** Non-exclusive streaming rights grant + IP ownership self-declaration (the two critical ones)

**Q2:** How should the legal document be presented to the creator?
- Options presented: In-page HTML / Generated PDF / Both
- **Selected:** Both — in-page to read + downloadable PDF copy after signing

**Q3:** Should the agreement text be a fixed standard template or dynamic based on film type/region?
- Options presented: Static template / Dynamic clauses per film type/region
- **Selected:** Dynamic clauses — different language for Short Films vs Feature Films, or regional language variants

---

## Area 2: Signature Mechanism

**Q1:** What signature method should creators use?
- Options presented: Typed name + checkbox + timestamp / Typed name + drawn canvas / Aadhaar e-Sign / DSC
- **Selected:** Typed name + drawn canvas signature (stylized, visually impressive, stored as image alongside record)

**Q2:** How should the signature be stored as a legal record?
- Options presented: Raw signature image + metadata in licence_agreements / PDF with signature embedded / Both
- **Selected:** Both — raw signature image stored separately + PDF generated with it embedded (comprehensive audit trail)

**Q3:** When does the creator encounter the signature flow?
- Options presented: Inside the submission wizard / One-time onboarding (first film only) / Per-film every time
- **Selected:** One-time onboarding — sign once, all future films reference the same agreement unless terms change

---

## Area 3: Verification Depth

**Q1:** How much proof must creators provide beyond their own declaration?
- Options presented: Self-declaration only / Mandatory document uploads / Tiered by film type
- **Selected:** Self-declaration only — platform not liable if creator lied (standard for indie platforms)

**Q2:** How does Staff view and verify the creator's legal agreement?
- Options presented: Dedicated Legal Verification tab / Inline in Review Modal / Status badge only
- **Selected:** Dedicated "Legal Verification" tab in Staff Console — agreement details, signature preview, verify action

---

## Area 4: Retention & Revocation

**Q1:** Where and how long should signed agreements be retained?
- Options presented: Supabase Storage lifetime / Supabase with defined retention period / External legal archive
- **Selected:** Supabase Storage (lifetime of platform) + licence_agreements table row — zero extra infra

**Q2:** What happens to the legal agreement if creator requests content removal or account deletion?
- Options presented: Agreement NEVER deleted (good faith evidence) / Archived with 'revoked' status / Creator can request full deletion
- **Selected:** Content is taken down but the legal agreement record is NEVER deleted — evidence TPF acted in good faith

**Q3:** Who can access the signed agreement records?
- Options presented: Admin only / Admin + Staff Curators / Creator themselves + Admin
- **Selected:** Creator themselves (download own copy) + Admin role only (view all agreements)

---

## Agent's Discretion Items

- PDF styling: match platform's dark cinema aesthetic (dark background, amber accents, TPF Cinemas header)
- Canvas widget: clear/reset button, mobile touch support, minimum stroke count guard
- Agreement version field (`"1.0.0"`) allows future re-sign flows when terms change

## Deferred Ideas

- Aadhaar e-Sign / DSC (external API cost + complexity)
- Per-film re-signing model
- Mandatory supporting document uploads (NOCs, chain-of-title)
- Copyright dispute resolution flow
- Multi-language agreement text (Telugu, Hindi, Tamil)

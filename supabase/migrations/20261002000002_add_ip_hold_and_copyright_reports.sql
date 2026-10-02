-- =====================================================================
-- Migration: 20261002000002_add_ip_hold_and_copyright_reports.sql
-- Purpose: Copyright enforcement — IP hold on films + complaint log table
-- Indian IT Act 2000 §79 safe harbour compliance
-- =====================================================================

-- ── 1. IP Hold columns on films ───────────────────────────────────────
ALTER TABLE public.films
  ADD COLUMN IF NOT EXISTS ip_hold          BOOLEAN      NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ip_hold_reason   TEXT,
  ADD COLUMN IF NOT EXISTS ip_hold_at       TIMESTAMPTZ;

COMMENT ON COLUMN public.films.ip_hold        IS 'TRUE = film is under IP hold and hidden from public. IT Act §79 compliance.';
COMMENT ON COLUMN public.films.ip_hold_reason IS 'Staff-entered reason for the IP hold / complaint summary.';
COMMENT ON COLUMN public.films.ip_hold_at     IS 'Timestamp when IP hold was applied.';

-- ── 2. copyright_reports table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.copyright_reports (
  id                        UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  film_id                   UUID         NOT NULL REFERENCES public.films(id) ON DELETE CASCADE,
  complainant_name          TEXT         NOT NULL,
  complainant_email         TEXT         NOT NULL,
  complainant_phone         TEXT,
  original_work_title       TEXT         NOT NULL,
  original_work_year        INT,
  violation_type            TEXT         NOT NULL
    CHECK (violation_type IN ('screenplay','music','footage','photograph','full_film','other')),
  violation_description     TEXT         NOT NULL,
  owns_original_rights      BOOLEAN      NOT NULL DEFAULT TRUE,
  good_faith_declaration    BOOLEAN      NOT NULL DEFAULT TRUE,
  penalty_awareness         BOOLEAN      NOT NULL DEFAULT TRUE,
  reported_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  status                    TEXT         NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','under_review','resolved_removed','resolved_dismissed')),
  staff_notes               TEXT,
  resolved_at               TIMESTAMPTZ,
  resolved_by               UUID         REFERENCES auth.users(id)
);

COMMENT ON TABLE public.copyright_reports IS
  'DMCA / Indian Copyright Act 1957 §51 infringement reports submitted by rights holders.';

-- ── 3. Indexes ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_copyright_reports_film_id    ON public.copyright_reports(film_id);
CREATE INDEX IF NOT EXISTS idx_copyright_reports_status     ON public.copyright_reports(status);
CREATE INDEX IF NOT EXISTS idx_films_ip_hold                ON public.films(ip_hold) WHERE ip_hold = TRUE;

-- ── 4. Row Level Security ─────────────────────────────────────────────
ALTER TABLE public.copyright_reports ENABLE ROW LEVEL SECURITY;

-- Anyone (anon) can INSERT a report (public complaint form)
CREATE POLICY "Public can submit copyright reports"
  ON public.copyright_reports FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated staff/admin can read reports
CREATE POLICY "Staff can read copyright reports"
  ON public.copyright_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('staff', 'admin')
    )
  );

-- Only staff/admin can update report status
CREATE POLICY "Staff can update copyright report status"
  ON public.copyright_reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('staff', 'admin')
    )
  );

-- ── 5. Grant column access ────────────────────────────────────────────
GRANT SELECT (ip_hold, ip_hold_reason, ip_hold_at) ON public.films TO anon, authenticated;
GRANT UPDATE (ip_hold, ip_hold_reason, ip_hold_at) ON public.films TO authenticated;
GRANT INSERT, SELECT ON public.copyright_reports TO anon, authenticated;
GRANT UPDATE ON public.copyright_reports TO authenticated;

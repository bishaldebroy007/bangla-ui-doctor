CREATE TABLE IF NOT EXISTS scans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url           TEXT NOT NULL,
  language_mode TEXT NOT NULL CHECK (language_mode IN ('bn','en','bilingual')),
  status        TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','completed','failed')),
  overall_score INTEGER,
  finding_count INTEGER,
  report_key    TEXT,
  error         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS scans_created_at_idx ON scans (created_at DESC);

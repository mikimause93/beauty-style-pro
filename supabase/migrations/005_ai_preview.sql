-- Migration: 005_ai_preview.sql
-- Description: AI Preview System tables for Beauty Style Pro v4.0
-- Provides virtual try-on (hair, makeup, nails, full look) via DALL-E 3

-- AI Preview Jobs: tracks each preview generation request
CREATE TABLE IF NOT EXISTS ai_preview_jobs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  input_image_url  TEXT,
  prompt           TEXT NOT NULL,
  style_type       TEXT NOT NULL DEFAULT 'hair'
                     CHECK (style_type IN ('hair', 'makeup', 'nails', 'full_look')),
  result_image_url TEXT,
  error_message    TEXT,
  tokens_used      INTEGER DEFAULT 0,
  model_used       TEXT DEFAULT 'dall-e-3',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_preview_jobs_user_id  ON ai_preview_jobs (user_id);
CREATE INDEX IF NOT EXISTS idx_ai_preview_jobs_status   ON ai_preview_jobs (status);
CREATE INDEX IF NOT EXISTS idx_ai_preview_jobs_created  ON ai_preview_jobs (created_at DESC);

-- AI Preview Saved Looks: user's look book (saved results)
CREATE TABLE IF NOT EXISTS ai_preview_looks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id      UUID NOT NULL REFERENCES ai_preview_jobs(id) ON DELETE CASCADE,
  title       TEXT,
  description TEXT,
  is_public   BOOLEAN DEFAULT FALSE,
  likes_count INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_preview_looks_user_id ON ai_preview_looks (user_id);
CREATE INDEX IF NOT EXISTS idx_ai_preview_looks_public  ON ai_preview_looks (is_public) WHERE is_public = TRUE;

-- AI Preview Usage: monthly quota tracking
CREATE TABLE IF NOT EXISTS ai_preview_usage (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_year    TEXT NOT NULL,  -- e.g. '2026-03'
  previews_used INTEGER NOT NULL DEFAULT 0,
  tokens_used   INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT uq_ai_preview_usage_user_month UNIQUE (user_id, month_year)
);

CREATE INDEX IF NOT EXISTS idx_ai_preview_usage_user_id ON ai_preview_usage (user_id);

-- Enable Row Level Security
ALTER TABLE ai_preview_jobs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_preview_looks  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_preview_usage  ENABLE ROW LEVEL SECURITY;

-- RLS Policies: ai_preview_jobs
CREATE POLICY "Users can manage their own preview jobs"
  ON ai_preview_jobs
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies: ai_preview_looks
CREATE POLICY "Users can manage their own looks"
  ON ai_preview_looks
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public looks are readable by authenticated users"
  ON ai_preview_looks
  FOR SELECT
  USING (is_public = TRUE AND auth.role() = 'authenticated');

-- RLS Policies: ai_preview_usage
CREATE POLICY "Users can view and update their own usage"
  ON ai_preview_usage
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to auto-update updated_at on ai_preview_jobs
CREATE OR REPLACE FUNCTION update_ai_preview_jobs_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ai_preview_jobs_updated_at
  BEFORE UPDATE ON ai_preview_jobs
  FOR EACH ROW EXECUTE FUNCTION update_ai_preview_jobs_updated_at();

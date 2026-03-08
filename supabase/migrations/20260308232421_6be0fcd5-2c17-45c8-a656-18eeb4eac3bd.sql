
-- Error logs table for professional debugging
CREATE TABLE public.error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type text NOT NULL DEFAULT 'unknown',
  message text NOT NULL,
  stack text,
  user_id uuid,
  page_path text,
  metadata jsonb DEFAULT '{}'::jsonb,
  severity text NOT NULL DEFAULT 'error',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Allow anyone to insert (including anonymous for pre-auth errors)
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert error logs"
  ON public.error_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read error logs"
  ON public.error_logs FOR SELECT
  TO authenticated
  USING (true);

-- Stress test results table
CREATE TABLE public.stress_test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_name text NOT NULL,
  test_type text NOT NULL DEFAULT 'manual',
  duration_ms integer,
  success boolean DEFAULT true,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.stress_test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert test results"
  ON public.stress_test_results FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated can read test results"
  ON public.stress_test_results FOR SELECT
  TO authenticated
  USING (true);

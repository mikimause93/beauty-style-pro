
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  page_path text NOT NULL,
  referrer text NULL,
  user_agent text NULL,
  device_type text NULL DEFAULT 'desktop',
  country text NULL,
  city text NULL,
  session_id text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (anonymous tracking)
CREATE POLICY "Anyone can insert page views"
  ON public.page_views FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated users can read (for admin dashboard)
CREATE POLICY "Authenticated users can read page views"
  ON public.page_views FOR SELECT
  TO authenticated
  USING (true);

-- Create index for fast queries
CREATE INDEX idx_page_views_created_at ON public.page_views (created_at DESC);
CREATE INDEX idx_page_views_page_path ON public.page_views (page_path);

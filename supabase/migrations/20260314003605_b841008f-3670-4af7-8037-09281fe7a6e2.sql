-- Fix page_views - keep anon access but add basic validation
DROP POLICY IF EXISTS "Anyone can insert page views" ON public.page_views;
CREATE POLICY "Anyone can insert page views" ON public.page_views
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (page_path IS NOT NULL AND length(page_path) < 500);
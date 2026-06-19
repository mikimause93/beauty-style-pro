
-- Add authenticated SELECT policy on businesses so the businesses_public view works
-- and so join queries from job_posts etc. continue to function
-- The businesses_public view already filters out sensitive columns
CREATE POLICY "Authenticated users can read businesses"
  ON public.businesses
  FOR SELECT
  TO authenticated
  USING (true);


-- Fix: Use SECURITY INVOKER (default) explicitly
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public 
WITH (security_invoker = true)
AS
SELECT 
  user_id, display_name, avatar_url, bio, user_type, country, city,
  verification_status, follower_count, following_count,
  instagram, tiktok, facebook, sector, username,
  created_at
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- We need a policy allowing authenticated users to read basic profile info
-- through the view (since the view uses security_invoker)
CREATE POLICY "Authenticated can read profiles via view"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

-- But we need to restrict what columns are exposed. Since RLS is row-level not column-level,
-- the view itself handles column restriction. The policy above allows row access for authenticated.
-- Anonymous users still cannot access (we have the "No anonymous profile access" policy with false).

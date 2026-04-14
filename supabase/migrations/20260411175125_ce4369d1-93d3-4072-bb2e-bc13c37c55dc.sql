
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
WITH (security_invoker = true) AS
SELECT
  user_id, display_name, avatar_url, bio, user_type,
  country, city, verification_status, follower_count,
  following_count, instagram, tiktok, facebook, sector,
  username, created_at
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO anon, authenticated;

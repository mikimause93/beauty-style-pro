
-- Allow authenticated users to see other users' public profile fields (display_name, avatar, etc)
-- while keeping sensitive columns (phone, whatsapp, GPS, cv_url) locked at the column level.

DROP POLICY IF EXISTS "Authenticated can read own profile" ON public.profiles;

CREATE POLICY "Authenticated can read public profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Column-level lockdown of sensitive fields for authenticated role.
-- Own-user sensitive data is served via the get_my_profile() RPC below.
REVOKE SELECT (phone, whatsapp, latitude, longitude, cv_url) ON public.profiles FROM authenticated;

-- SECURITY DEFINER function to fetch the caller's own full profile (all columns).
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS SETOF public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.profiles WHERE user_id = auth.uid()
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

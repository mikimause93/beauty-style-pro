
-- Allow anon users to read profiles (public data only, sensitive fields already removed)
DROP POLICY IF EXISTS "Authenticated can read profiles" ON public.profiles;
CREATE POLICY "Anyone can read profiles"
  ON public.profiles FOR SELECT
  TO anon, authenticated
  USING (true);

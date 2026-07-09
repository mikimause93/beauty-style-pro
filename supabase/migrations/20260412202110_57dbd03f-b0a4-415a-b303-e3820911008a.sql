
-- Fix: Allow anonymous users to read basic profile data again
-- The previous migration was too restrictive - it blocked all anon access
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON public.profiles;

-- Re-create a public read policy for profiles (basic public data)
CREATE POLICY "Anyone can read profiles"
  ON public.profiles
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Also fix professionals table - ensure public read access
DROP POLICY IF EXISTS "Anyone can view professionals" ON public.professionals;
CREATE POLICY "Anyone can view professionals"
  ON public.professionals
  FOR SELECT
  TO anon, authenticated
  USING (true);

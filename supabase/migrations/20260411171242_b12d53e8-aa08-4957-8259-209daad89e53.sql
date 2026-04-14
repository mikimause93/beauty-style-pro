
-- Remove the overly broad policy that exposes all profile data
DROP POLICY IF EXISTS "Authenticated can read profiles via view" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated can read profiles" ON public.profiles;

-- Ensure owner-only read exists  
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

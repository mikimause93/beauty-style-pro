-- Allow anonymous users to SELECT from profiles (needed for profiles_public view)
CREATE POLICY "Anon can read public profile fields"
ON public.profiles
FOR SELECT
TO anon
USING (true);

-- Allow anonymous users to SELECT from businesses (needed for businesses_public view)
CREATE POLICY "Anon can read public business fields"
ON public.businesses
FOR SELECT
TO anon
USING (true);

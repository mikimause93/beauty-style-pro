
-- Restore anon access to profiles - needed for feed/posts/stories to show names and avatars
-- Phone numbers are intentionally public in this app for professional contact
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON public.profiles;

CREATE POLICY "Anyone can read profiles"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (true);

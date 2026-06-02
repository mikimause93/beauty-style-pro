
CREATE POLICY "Public can read basic profiles"
ON public.profiles
FOR SELECT
TO anon
USING (true);

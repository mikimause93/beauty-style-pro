
-- Fix: Phone numbers exposed to unauthenticated users via "Anyone can read profiles" policy
-- Replace overly permissive anon+authenticated SELECT policy with authenticated-only policy
-- Anon users should use the profiles_public view which excludes sensitive fields

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;

-- Create a new policy that only allows authenticated users to read profiles
CREATE POLICY "Authenticated users can read profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

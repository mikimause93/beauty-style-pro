
-- Fix 1: Remove the overly permissive public SELECT policy on businesses
-- The owner already has their own SELECT policy, and the businesses_public view exists for public access
DROP POLICY IF EXISTS "Public can read businesses" ON public.businesses;

-- Fix 2: Lock down user_roles table - prevent any user from self-assigning roles
-- Only the service role (server-side) should be able to INSERT/UPDATE/DELETE roles
CREATE POLICY "No user can insert roles"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "No user can update roles"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "No user can delete roles"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (false);

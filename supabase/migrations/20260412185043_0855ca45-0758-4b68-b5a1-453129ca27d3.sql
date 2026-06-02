
-- Fix 1: Restrict notifications INSERT to only allow users to create notifications for themselves
-- (server-side triggers use SECURITY DEFINER and bypass RLS, so they still work)
DROP POLICY "Authenticated users can insert notifications" ON public.notifications;
CREATE POLICY "Users can only insert own notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Fix 2: Remove anon access from profiles - only authenticated users can read profiles
-- This keeps phone numbers visible to logged-in users (business requirement) but hides them from anonymous visitors
DROP POLICY "Anyone can read profiles" ON public.profiles;
CREATE POLICY "Authenticated users can read profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

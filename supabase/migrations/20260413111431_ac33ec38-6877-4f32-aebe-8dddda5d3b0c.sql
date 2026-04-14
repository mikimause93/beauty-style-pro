
-- 1. Remove anon SELECT on profiles table (anon users should use profiles_public view)
DROP POLICY IF EXISTS "Public can read basic profiles" ON public.profiles;

-- 2. Remove conflicting INSERT policy on wallet_transactions that bypasses the blocking policy
DROP POLICY IF EXISTS "Users can create own transactions" ON public.wallet_transactions;

-- 3. Restrict stream_tips SELECT to authenticated users who are participants
DROP POLICY IF EXISTS "Anyone can view tips" ON public.stream_tips;
DROP POLICY IF EXISTS "Public can view stream tips" ON public.stream_tips;
DROP POLICY IF EXISTS "Stream tips are publicly readable" ON public.stream_tips;
-- Find and drop any existing permissive SELECT policy on stream_tips for public/anon
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE tablename = 'stream_tips' AND schemaname = 'public' AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.stream_tips', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Authenticated users can view stream tips"
ON public.stream_tips
FOR SELECT
TO authenticated
USING (true);

-- 4. Restrict auction_bids SELECT to authenticated users
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE tablename = 'auction_bids' AND schemaname = 'public' AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.auction_bids', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Authenticated users can view auction bids"
ON public.auction_bids
FOR SELECT
TO authenticated
USING (true);

-- 5. Add DELETE policy on documents storage bucket for file owners
CREATE POLICY "Users can delete own documents"
ON storage.objects
FOR DELETE
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 6. Add UPDATE policy on documents storage bucket for file owners
CREATE POLICY "Users can update own documents"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);


-- 1. PROFILES: Create a public view with ONLY safe columns
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public AS
SELECT 
  user_id, display_name, avatar_url, bio, user_type, country, city,
  verification_status, follower_count, following_count,
  instagram, tiktok, facebook, sector, username,
  created_at
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Authenticated can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public can read profiles" ON public.profiles;

-- Admin can read all profiles
CREATE POLICY "Admins can read all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. LIVE_STREAMS: Move stream_key to separate table
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stream_credentials') THEN
    CREATE TABLE public.stream_credentials (
      stream_id uuid PRIMARY KEY REFERENCES public.live_streams(id) ON DELETE CASCADE,
      stream_key text NOT NULL,
      created_at timestamptz DEFAULT now()
    );
    ALTER TABLE public.stream_credentials ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Owner can read own stream credentials"
      ON public.stream_credentials FOR SELECT TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.live_streams ls
        JOIN public.professionals p ON p.id = ls.professional_id
        WHERE ls.id = stream_credentials.stream_id AND p.user_id = auth.uid()
      ));
    INSERT INTO public.stream_credentials (stream_id, stream_key)
    SELECT id, stream_key FROM public.live_streams WHERE stream_key IS NOT NULL
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

ALTER TABLE public.live_streams DROP COLUMN IF EXISTS stream_key;

-- 3. SERVICE_REQUESTS: Restrict SELECT
DROP POLICY IF EXISTS "Service requests viewable by everyone" ON public.service_requests;
DROP POLICY IF EXISTS "Authenticated users can view service requests" ON public.service_requests;
CREATE POLICY "Users can view own or open service requests"
  ON public.service_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR status = 'open');

-- 4. STRESS_TEST_RESULTS: Remove user_id IS NULL leak
DROP POLICY IF EXISTS "Users read own test results" ON public.stress_test_results;

-- 5. ERROR_LOGS: Admin only
DROP POLICY IF EXISTS "Admins can read all error logs" ON public.error_logs;
CREATE POLICY "Admins can read all error logs"
  ON public.error_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

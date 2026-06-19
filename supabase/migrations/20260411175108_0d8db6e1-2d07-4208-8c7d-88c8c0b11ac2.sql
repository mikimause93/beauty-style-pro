
-- 1. Create profiles_private table for sensitive data
CREATE TABLE IF NOT EXISTS public.profiles_private (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  iban TEXT,
  bank_holder_name TEXT,
  otp_code TEXT,
  otp_expires_at TIMESTAMPTZ,
  document_urls TEXT[],
  verification_notes TEXT,
  birth_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles_private ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can read own private data"
  ON public.profiles_private FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Owner can update own private data"
  ON public.profiles_private FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Owner can insert own private data"
  ON public.profiles_private FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 2. Migrate existing sensitive data from profiles to profiles_private
INSERT INTO public.profiles_private (user_id, iban, bank_holder_name, otp_code, otp_expires_at, document_urls, verification_notes, birth_date)
SELECT user_id, iban, bank_holder_name, otp_code, otp_expires_at, document_urls, verification_notes, birth_date
FROM public.profiles
WHERE iban IS NOT NULL 
   OR otp_code IS NOT NULL 
   OR document_urls IS NOT NULL 
   OR verification_notes IS NOT NULL
   OR birth_date IS NOT NULL
   OR bank_holder_name IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- 3. Drop sensitive columns from profiles (data is now in profiles_private)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS iban;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS bank_holder_name;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS otp_code;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS otp_expires_at;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS document_urls;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS verification_notes;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS birth_date;

-- 4. Now safe to add back broad SELECT for authenticated (no sensitive data left)
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own full profile" ON public.profiles;
DROP POLICY IF EXISTS "No anonymous profile access" ON public.profiles;

CREATE POLICY "Authenticated can read profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

-- Keep existing update/insert policies (owner only)
-- Keep admin read policy

-- 5. Recreate profiles_public view (now redundant but kept for API consistency)
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
WITH (security_invoker = false) AS
SELECT
  user_id, display_name, avatar_url, bio, user_type,
  country, city, verification_status, follower_count,
  following_count, instagram, tiktok, facebook, sector,
  username, created_at
FROM public.profiles;

GRANT SELECT ON public.profiles_public TO anon, authenticated;

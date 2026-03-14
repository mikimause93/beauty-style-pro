
-- Add business-specific fields to verification_requests
ALTER TABLE public.verification_requests ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE public.verification_requests ADD COLUMN IF NOT EXISTS vat_number TEXT;
ALTER TABLE public.verification_requests ADD COLUMN IF NOT EXISTS tax_code TEXT;
ALTER TABLE public.verification_requests ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.verification_requests ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.verification_requests ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.verification_requests ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'client';
ALTER TABLE public.verification_requests ADD COLUMN IF NOT EXISTS license_urls TEXT[];
ALTER TABLE public.verification_requests ADD COLUMN IF NOT EXISTS reviewer_id UUID;
ALTER TABLE public.verification_requests ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add verification_level to profiles (none, basic, verified, premium)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_level TEXT NOT NULL DEFAULT 'none';
-- Add account_type if not existing
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'client';

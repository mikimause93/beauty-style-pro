
-- Add missing columns to profiles for multi-registration
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS surname text,
  ADD COLUMN IF NOT EXISTS country text DEFAULT 'Italia',
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS interests text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS username text;

-- Add whatsapp to professionals
ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS price_min numeric,
  ADD COLUMN IF NOT EXISTS price_max numeric,
  ADD COLUMN IF NOT EXISTS portfolio_images text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;

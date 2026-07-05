
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS show_whatsapp boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_phone    boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_location boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_cv       boolean NOT NULL DEFAULT false;

-- These new columns are safe to expose to everyone (they are just preferences).
GRANT SELECT (show_whatsapp, show_phone, show_location, show_cv) ON public.profiles TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.get_public_contact(_user_id uuid)
RETURNS TABLE(
  whatsapp text,
  phone text,
  latitude double precision,
  longitude double precision,
  cv_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    CASE WHEN p.show_whatsapp THEN p.whatsapp END,
    CASE WHEN p.show_phone    THEN p.phone    END,
    CASE WHEN p.show_location THEN p.latitude END,
    CASE WHEN p.show_location THEN p.longitude END,
    CASE WHEN p.show_cv       THEN p.cv_url   END
  FROM public.profiles p
  WHERE p.user_id = _user_id
$$;

REVOKE EXECUTE ON FUNCTION public.get_public_contact(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_public_contact(uuid) TO authenticated, anon;

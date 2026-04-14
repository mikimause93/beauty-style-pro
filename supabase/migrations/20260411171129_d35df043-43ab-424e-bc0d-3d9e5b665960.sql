
-- Drop existing view first, then recreate
DROP VIEW IF EXISTS public.businesses_public;

CREATE VIEW public.businesses_public
WITH (security_invoker = true) AS
SELECT
  id, business_name, business_type, description, bio,
  city, address, zip_code, latitude, longitude,
  logo_url, cover_image_url, categories,
  rating, review_count, featured, active, verified,
  website, instagram, facebook, phone, email,
  working_hours, slug, created_at, updated_at, user_id
FROM public.businesses;

GRANT SELECT ON public.businesses_public TO anon, authenticated;

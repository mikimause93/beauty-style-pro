
-- Fix profiles_public to use SECURITY INVOKER (default, but make explicit)
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public
  WITH (security_invoker = true)
  AS SELECT user_id, display_name, avatar_url, bio, user_type, country, city,
         verification_status, follower_count, following_count,
         instagram, tiktok, facebook, sector, username, skills, qr_coins,
         color_theme, gender, created_at
  FROM public.profiles;
GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- Also fix businesses_public if it has the same issue
DROP VIEW IF EXISTS public.businesses_public;
CREATE VIEW public.businesses_public
  WITH (security_invoker = true)
  AS SELECT id, user_id, business_name, business_type, description, bio, city,
         address, phone, email, website, instagram, facebook, slug,
         logo_url, cover_image_url, rating, review_count, verified,
         verification_status, featured, active, categories, latitude,
         longitude, working_hours, employee_count, created_at, updated_at
  FROM public.businesses;
GRANT SELECT ON public.businesses_public TO anon, authenticated;

-- ============================================================
-- Enhance handle_new_user trigger to save all profile fields
-- collected during multi-step registration (phone, city, IBAN, etc.)
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  meta jsonb;
BEGIN
  meta := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);

  INSERT INTO public.profiles (
    user_id, display_name, avatar_url, user_type, country,
    phone, city, bio, username,
    instagram, tiktok, facebook,
    iban, bank_holder_name,
    surname, whatsapp,
    birth_date, interests,
    latitude, longitude
  )
  VALUES (
    NEW.id,
    COALESCE(meta->>'display_name', NEW.email),
    meta->>'avatar_url',
    COALESCE(meta->>'user_type', 'client'),
    COALESCE(meta->>'country', 'Italia'),
    meta->>'phone',
    meta->>'city',
    meta->>'bio',
    meta->>'username',
    meta->>'instagram',
    meta->>'tiktok',
    meta->>'facebook',
    meta->>'iban',
    meta->>'bank_holder_name',
    meta->>'surname',
    meta->>'whatsapp',
    CASE
      WHEN meta->>'birth_date' IS NOT NULL AND meta->>'birth_date' <> ''
      THEN (meta->>'birth_date')::date
      ELSE NULL
    END,
    CASE
      WHEN jsonb_typeof(meta->'interests') = 'array'
      THEN ARRAY(SELECT jsonb_array_elements_text(meta->'interests'))
      ELSE '{}'::text[]
    END,
    CASE
      WHEN meta->>'latitude' IS NOT NULL AND meta->>'latitude' <> ''
      THEN (meta->>'latitude')::double precision
      ELSE NULL
    END,
    CASE
      WHEN meta->>'longitude' IS NOT NULL AND meta->>'longitude' <> ''
      THEN (meta->>'longitude')::double precision
      ELSE NULL
    END
  );

  RETURN NEW;
END;
$$;

-- Update handle_new_user trigger to save all profile fields from signup metadata.
-- This ensures phone, city, birthDate, etc. collected during registration are persisted
-- immediately when the auth user is created (before email confirmation).
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_interests TEXT[];
  v_birth_date DATE;
  v_latitude DOUBLE PRECISION;
  v_longitude DOUBLE PRECISION;
BEGIN
  -- Parse interests array from JSON metadata (ignore if malformed)
  BEGIN
    IF NEW.raw_user_meta_data->>'interests' IS NOT NULL THEN
      v_interests := ARRAY(SELECT json_array_elements_text(NEW.raw_user_meta_data->'interests'));
    END IF;
  EXCEPTION WHEN others THEN
    v_interests := NULL;
  END;

  -- Parse birth_date (ignore if malformed)
  BEGIN
    IF NULLIF(NEW.raw_user_meta_data->>'birth_date', '') IS NOT NULL THEN
      v_birth_date := (NEW.raw_user_meta_data->>'birth_date')::DATE;
    END IF;
  EXCEPTION WHEN others THEN
    v_birth_date := NULL;
  END;

  -- Parse latitude (ignore if malformed)
  BEGIN
    IF NULLIF(NEW.raw_user_meta_data->>'latitude', '') IS NOT NULL THEN
      v_latitude := (NEW.raw_user_meta_data->>'latitude')::DOUBLE PRECISION;
    END IF;
  EXCEPTION WHEN others THEN
    v_latitude := NULL;
  END;

  -- Parse longitude (ignore if malformed)
  BEGIN
    IF NULLIF(NEW.raw_user_meta_data->>'longitude', '') IS NOT NULL THEN
      v_longitude := (NEW.raw_user_meta_data->>'longitude')::DOUBLE PRECISION;
    END IF;
  EXCEPTION WHEN others THEN
    v_longitude := NULL;
  END;

  INSERT INTO public.profiles (
    user_id,
    display_name,
    avatar_url,
    user_type,
    account_type,
    country,
    phone,
    surname,
    username,
    city,
    birth_date,
    bio,
    instagram,
    tiktok,
    facebook,
    whatsapp,
    interests,
    latitude,
    longitude
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'client'),
    COALESCE(NEW.raw_user_meta_data->>'account_type', NEW.raw_user_meta_data->>'user_type', 'client'),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'country', ''), 'Italia'),
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
    NULLIF(NEW.raw_user_meta_data->>'surname', ''),
    NULLIF(NEW.raw_user_meta_data->>'username', ''),
    NULLIF(NEW.raw_user_meta_data->>'city', ''),
    v_birth_date,
    NULLIF(NEW.raw_user_meta_data->>'bio', ''),
    NULLIF(NEW.raw_user_meta_data->>'instagram', ''),
    NULLIF(NEW.raw_user_meta_data->>'tiktok', ''),
    NULLIF(NEW.raw_user_meta_data->>'facebook', ''),
    NULLIF(NEW.raw_user_meta_data->>'whatsapp', ''),
    v_interests,
    v_latitude,
    v_longitude
  );
  RETURN NEW;
END;
$function$;

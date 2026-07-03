
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (
  id, user_id, display_name, avatar_url, bio, user_type, city, country,
  follower_count, following_count, created_at, updated_at,
  interests, skills, desired_categories, portfolio_urls, experience_years,
  verification_status, verification_level, account_type,
  username, instagram, tiktok, facebook, sector, gender, color_theme,
  surname
) ON public.profiles TO anon;

REVOKE SELECT ON public.businesses FROM anon;
GRANT SELECT (
  id, user_id, business_type, business_name, slug, logo_url, cover_image_url,
  branding_theme, categories, bio, description, city, rating, review_count,
  employee_count, featured, active, working_hours, created_at, updated_at,
  verification_status, verified, instagram, facebook, website
) ON public.businesses TO anon;

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND NOT (verification_status IS DISTINCT FROM (
    SELECT p.verification_status FROM public.profiles p WHERE p.user_id = auth.uid()
  ))
  AND NOT (qr_coins IS DISTINCT FROM (
    SELECT p.qr_coins FROM public.profiles p WHERE p.user_id = auth.uid()
  ))
);

CREATE OR REPLACE FUNCTION public.debit_qr_coins(_user_id uuid, _amount numeric)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_balance numeric;
BEGIN
  UPDATE public.profiles SET qr_coins = qr_coins - _amount, updated_at = now()
  WHERE user_id = _user_id AND qr_coins >= _amount
  RETURNING qr_coins INTO new_balance;
  IF new_balance IS NULL THEN RAISE EXCEPTION 'Insufficient balance'; END IF;
  RETURN new_balance;
END; $$;

CREATE OR REPLACE FUNCTION public.credit_qr_coins(_user_id uuid, _amount numeric)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_balance numeric;
BEGIN
  UPDATE public.profiles SET qr_coins = COALESCE(qr_coins,0) + _amount, updated_at = now()
  WHERE user_id = _user_id RETURNING qr_coins INTO new_balance;
  RETURN new_balance;
END; $$;

CREATE OR REPLACE FUNCTION public.debit_ai_credits(_user_id uuid, _amount integer)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_balance integer;
BEGIN
  UPDATE public.ai_credits SET balance = balance - _amount, updated_at = now()
  WHERE user_id = _user_id AND balance >= _amount
  RETURNING balance INTO new_balance;
  IF new_balance IS NULL THEN RAISE EXCEPTION 'Insufficient AI credits'; END IF;
  RETURN new_balance;
END; $$;

REVOKE ALL ON FUNCTION public.debit_qr_coins(uuid, numeric) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.credit_qr_coins(uuid, numeric) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.debit_ai_credits(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.debit_qr_coins(uuid, numeric) TO service_role;
GRANT EXECUTE ON FUNCTION public.credit_qr_coins(uuid, numeric) TO service_role;
GRANT EXECUTE ON FUNCTION public.debit_ai_credits(uuid, integer) TO service_role;

DROP POLICY IF EXISTS "Anyone can insert page views" ON public.page_views;
CREATE POLICY "Anyone can insert page views"
ON public.page_views FOR INSERT
TO anon, authenticated
WITH CHECK (
  page_path IS NOT NULL AND length(page_path) < 500 AND (
    (auth.uid() IS NULL AND user_id IS NULL)
    OR (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()))
  )
);

DROP POLICY IF EXISTS "Authenticated users can view stream tips" ON public.stream_tips;
CREATE POLICY "Tippers and stream owners can view tips"
ON public.stream_tips FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.live_streams ls
    JOIN public.professionals p ON p.id = ls.professional_id
    WHERE ls.id = stream_tips.stream_id AND p.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can view own documents" ON storage.objects;
CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM public.verification_requests vr WHERE vr.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Avatar images publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Post images publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Product images publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view look photos" ON storage.objects;

REVOKE EXECUTE ON FUNCTION public.cleanup_old_call_signals() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text, jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_smart_reminder_after_booking() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.init_ai_credits() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_on_booking() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_on_comment() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_on_follow() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_on_like() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_on_message() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_on_unfollow() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_push_on_insert() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.on_unlike() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_battle_score() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_challenge_donation_total() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_challenge_vote_count() FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.apply_shipping_promo(text, text, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_shipping_promo(text, text, numeric) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.stella_check_rate_limit(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.stella_check_rate_limit(uuid, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.track_user_action(uuid, text, jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_user_action(uuid, text, jsonb, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_chatbot_suggestions(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_chatbot_suggestions(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_own_stream_key(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_own_stream_key(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated, service_role;

CREATE SCHEMA IF NOT EXISTS extensions;
DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

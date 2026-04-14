
-- 1. Drop overly permissive public SELECT policy on profiles
DROP POLICY IF EXISTS "Public can read profiles" ON public.profiles;

-- Block anonymous access
CREATE POLICY "No anonymous profile access"
  ON public.profiles FOR SELECT TO anon
  USING (false);

-- Authenticated users can read all profiles (needed for social features)
CREATE POLICY "Authenticated can read profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

-- 2. Create stream_credentials table to isolate stream_key
CREATE TABLE IF NOT EXISTS public.stream_credentials (
  stream_id uuid PRIMARY KEY REFERENCES public.live_streams(id) ON DELETE CASCADE,
  stream_key text NOT NULL
);
ALTER TABLE public.stream_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can read own stream key"
  ON public.stream_credentials FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.live_streams ls
    JOIN public.professionals p ON p.id = ls.professional_id
    WHERE ls.id = stream_id AND p.user_id = auth.uid()
  ));

-- Migrate existing stream_key data
INSERT INTO public.stream_credentials (stream_id, stream_key)
SELECT id, stream_key FROM public.live_streams WHERE stream_key IS NOT NULL
ON CONFLICT (stream_id) DO NOTHING;

-- 3. Admin policies for user_reports
CREATE POLICY "Admins can view all reports"
  ON public.user_reports FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update reports"
  ON public.user_reports FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. Admin policies for verification_requests
CREATE POLICY "Admins can view all verifications"
  ON public.verification_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update verifications"
  ON public.verification_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. Fix affiliate_sales INSERT policy
DROP POLICY IF EXISTS "System inserts affiliate sales" ON public.affiliate_sales;
CREATE POLICY "Buyers can insert own affiliate sales"
  ON public.affiliate_sales FOR INSERT TO authenticated
  WITH CHECK (buyer_id = auth.uid());

-- 6. Fix platform_commissions INSERT policy
DROP POLICY IF EXISTS "System inserts commissions" ON public.platform_commissions;
CREATE POLICY "Only system inserts commissions"
  ON public.platform_commissions FOR INSERT TO authenticated
  WITH CHECK (buyer_id = auth.uid());

-- 7. Fix service_requests SELECT policy
DROP POLICY IF EXISTS "Service requests viewable by everyone" ON public.service_requests;
CREATE POLICY "Authenticated users can view service requests"
  ON public.service_requests FOR SELECT TO authenticated
  USING (true);

-- 8. Fix stress_test_results null user leak
DROP POLICY IF EXISTS "Users can read own stress test results" ON public.stress_test_results;
CREATE POLICY "Users can read own stress test results"
  ON public.stress_test_results FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Admins can read all stress test results"
  ON public.stress_test_results FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 9. Fix track_user_action to validate caller
CREATE OR REPLACE FUNCTION public.track_user_action(
  _user_id uuid, _action_type text,
  _action_data jsonb DEFAULT '{}'::jsonb, _page_context text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != _user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  INSERT INTO public.user_actions_tracking(user_id, action_type, action_data, page_context)
  VALUES (_user_id, _action_type, _action_data, _page_context);
END;
$$;

-- 10. Fix get_chatbot_suggestions to validate caller
CREATE OR REPLACE FUNCTION public.get_chatbot_suggestions(_user_id uuid)
RETURNS TABLE(suggestion_id uuid, message_type text, content text, action_buttons jsonb, priority integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  user_profile public.profiles;
  user_stats RECORD;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != _user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO user_profile FROM public.profiles WHERE user_id = _user_id;
  
  SELECT 
    EXTRACT(days FROM (now() - user_profile.created_at)) as days_active,
    (SELECT COUNT(*) FROM public.posts WHERE user_id = _user_id) as posts_count,
    (SELECT COUNT(*) FROM public.bookings WHERE client_id = _user_id) as booking_count,
    (SELECT COUNT(*) FROM public.live_streams WHERE professional_id = (SELECT id FROM public.professionals WHERE user_id = _user_id)) as live_streams_count,
    (SELECT COUNT(*) FROM public.notifications WHERE user_id = _user_id AND read = false) as notifications_unread,
    user_profile.qr_coins as qr_coins,
    CASE WHEN EXISTS(SELECT 1 FROM public.user_subscriptions WHERE user_id = _user_id AND status = 'active') THEN true ELSE false END as subscription_active
  INTO user_stats;
  
  RETURN QUERY
  SELECT 
    gen_random_uuid() as suggestion_id,
    'suggestion'::TEXT as message_type,
    config.suggestion_template as content,
    CASE 
      WHEN config.suggestion_template ILIKE '%post%' THEN '[{"text": "Crea Post", "action": "navigate", "target": "/create-post"}]'::JSONB
      WHEN config.suggestion_template ILIKE '%live%' THEN '[{"text": "Vai Live", "action": "navigate", "target": "/go-live"}]'::JSONB
      WHEN config.suggestion_template ILIKE '%prenotare%' THEN '[{"text": "Cerca Professionisti", "action": "navigate", "target": "/stylists"}]'::JSONB
      WHEN config.suggestion_template ILIKE '%wallet%' THEN '[{"text": "Apri Wallet", "action": "navigate", "target": "/wallet"}]'::JSONB
      WHEN config.suggestion_template ILIKE '%notifiche%' THEN '[{"text": "Vedi Notifiche", "action": "navigate", "target": "/notifications"}]'::JSONB
      WHEN config.suggestion_template ILIKE '%profilo%' THEN '[{"text": "Completa Profilo", "action": "navigate", "target": "/edit-profile"}]'::JSONB
      WHEN config.suggestion_template ILIKE '%Premium%' THEN '[{"text": "Scopri Pro", "action": "navigate", "target": "/subscriptions"}]'::JSONB
      ELSE '[{"text": "Scopri", "action": "dismiss"}]'::JSONB
    END as action_buttons,
    config.priority
  FROM public.chatbot_suggestions_config config
  WHERE config.user_type = user_profile.user_type 
    AND config.active = true
    AND (
      (config.trigger_conditions->>'posts_count' IS NULL OR 
       (config.trigger_conditions->>'posts_count')::int >= user_stats.posts_count) AND
      (config.trigger_conditions->>'booking_count' IS NULL OR 
       (config.trigger_conditions->>'booking_count')::int >= user_stats.booking_count) AND
      (config.trigger_conditions->>'days_active' IS NULL OR 
       (config.trigger_conditions->>'days_active')::int <= user_stats.days_active) AND
      (config.trigger_conditions->>'live_streams_count' IS NULL OR 
       (config.trigger_conditions->>'live_streams_count')::int >= user_stats.live_streams_count) AND
      (config.trigger_conditions->>'qr_coins' IS NULL OR 
       (config.trigger_conditions->>'qr_coins')::int >= user_stats.qr_coins) AND
      (config.trigger_conditions->>'subscription_active' IS NULL OR 
       (config.trigger_conditions->>'subscription_active')::bool = user_stats.subscription_active)
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.user_suggestion_history 
      WHERE user_id = _user_id 
        AND suggestion_type = config.suggestion_template
        AND last_shown_at > (now() - INTERVAL '1 hour' * config.max_frequency_hours)
    )
  ORDER BY config.priority DESC
  LIMIT 3;
END;
$$;

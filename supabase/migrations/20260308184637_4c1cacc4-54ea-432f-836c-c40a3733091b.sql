
-- Subscription plans
CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  price_monthly numeric NOT NULL DEFAULT 0,
  price_yearly numeric NOT NULL DEFAULT 0,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  max_services integer DEFAULT 3,
  ads_included boolean DEFAULT false,
  analytics_access boolean DEFAULT false,
  map_priority boolean DEFAULT false,
  ai_promotion boolean DEFAULT false,
  priority_support boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plans viewable by everyone" ON public.subscription_plans FOR SELECT USING (true);

-- User subscriptions
CREATE TABLE public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  status text NOT NULL DEFAULT 'active',
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  is_trial boolean DEFAULT false,
  payment_method text DEFAULT 'wallet',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create subscriptions" ON public.user_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscriptions" ON public.user_subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- Profile boosts
CREATE TABLE public.profile_boosts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  boost_type text NOT NULL DEFAULT 'visibility',
  duration_days integer NOT NULL DEFAULT 1,
  price_paid numeric NOT NULL DEFAULT 0,
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_boosts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own boosts" ON public.profile_boosts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create boosts" ON public.profile_boosts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Boosts viewable for ranking" ON public.profile_boosts FOR SELECT USING (active = true);

-- Platform settings (commission rates, promo status, etc.)
CREATE TABLE public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings viewable by everyone" ON public.platform_settings FOR SELECT USING (true);

-- Insert default plans
INSERT INTO public.subscription_plans (name, slug, price_monthly, price_yearly, features, max_services, ads_included, analytics_access, map_priority, ai_promotion, priority_support, sort_order) VALUES
('Free', 'free', 0, 0, '["Profilo base", "Chat", "Prenotazioni", "Feed"]', 3, false, false, false, false, false, 0),
('Pro', 'pro', 9.99, 99, '["Più visibilità", "Priorità ricerca", "Analytics", "Upload illimitati"]', 10, false, true, false, false, false, 1),
('Business', 'business', 29.99, 299, '["Profilo business", "Priorità mappa", "Badge sponsorizzato", "Strumenti ads", "Statistiche", "Servizi multipli"]', 50, false, true, true, false, false, 2),
('Premium', 'premium', 49.99, 499, '["Top ranking", "Profilo in evidenza", "Ads incluse", "AI promozione", "Suggerimenti auto", "Supporto prioritario"]', -1, true, true, true, true, true, 3);

-- Insert default platform settings
INSERT INTO public.platform_settings (key, value) VALUES
('booking_commission_percent', '{"value": 5}'::jsonb),
('promo_first_1000', '{"enabled": true, "max_users": 1000}'::jsonb),
('boost_prices', '{"1": 4.99, "7": 24.99, "30": 79.99}'::jsonb);

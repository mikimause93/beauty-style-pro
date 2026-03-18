-- Creator Monetization Tables
-- creator_profiles: extended info for creators
CREATE TABLE IF NOT EXISTS public.creator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  display_name TEXT,
  bio TEXT,
  niche TEXT,
  instagram TEXT,
  tiktok TEXT,
  youtube TEXT,
  website TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  subscription_price NUMERIC(10,2) DEFAULT 0,
  total_subscribers INTEGER NOT NULL DEFAULT 0,
  total_earnings NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- creator_earnings: per-transaction earnings log
CREATE TABLE IF NOT EXISTS public.creator_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('subscription', 'tip', 'booking', 'partnership', 'other')),
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- creator_payouts: payout requests
CREATE TABLE IF NOT EXISTS public.creator_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  bank_iban TEXT,
  paypal_email TEXT,
  notes TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- creator_memberships: membership tiers a creator offers
CREATE TABLE IF NOT EXISTS public.creator_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  interval TEXT NOT NULL DEFAULT 'month' CHECK (interval IN ('month', 'year')),
  perks TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- user_subscriptions: user subscriptions to creator memberships
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  membership_id UUID NOT NULL REFERENCES public.creator_memberships(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  UNIQUE (user_id, membership_id)
);

-- tips: one-time tips from fans to creators
CREATE TABLE IF NOT EXISTS public.tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- brand_partnerships: partnership deals for creators
CREATE TABLE IF NOT EXISTS public.brand_partnerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  brand_name TEXT NOT NULL,
  deal_type TEXT NOT NULL CHECK (deal_type IN ('sponsored_post', 'ambassador', 'affiliate', 'product_review', 'other')),
  value NUMERIC(12,2) DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'rejected')),
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- creator_analytics: daily snapshot of creator metrics
CREATE TABLE IF NOT EXISTS public.creator_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  views INTEGER NOT NULL DEFAULT 0,
  new_subscribers INTEGER NOT NULL DEFAULT 0,
  tips_count INTEGER NOT NULL DEFAULT 0,
  tips_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  earnings NUMERIC(12,2) NOT NULL DEFAULT 0,
  UNIQUE (creator_id, date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_creator_profiles_user_id ON public.creator_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_creator_earnings_creator_id ON public.creator_earnings(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_payouts_creator_id ON public.creator_payouts(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_memberships_creator_id ON public.creator_memberships(creator_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_creator_id ON public.user_subscriptions(creator_id);
CREATE INDEX IF NOT EXISTS idx_tips_creator_id ON public.tips(creator_id);
CREATE INDEX IF NOT EXISTS idx_brand_partnerships_creator_id ON public.brand_partnerships(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_analytics_creator_id ON public.creator_analytics(creator_id);

-- RLS
ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_partnerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_analytics ENABLE ROW LEVEL SECURITY;

-- creator_profiles: public read, owner write
CREATE POLICY "creator_profiles_public_read" ON public.creator_profiles FOR SELECT USING (true);
CREATE POLICY "creator_profiles_owner_insert" ON public.creator_profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "creator_profiles_owner_update" ON public.creator_profiles FOR UPDATE USING (user_id = auth.uid());

-- creator_earnings: owner read only
CREATE POLICY "creator_earnings_owner_read" ON public.creator_earnings FOR SELECT
  USING (creator_id IN (SELECT id FROM public.creator_profiles WHERE user_id = auth.uid()));

-- creator_payouts: owner read/insert
CREATE POLICY "creator_payouts_owner_read" ON public.creator_payouts FOR SELECT
  USING (creator_id IN (SELECT id FROM public.creator_profiles WHERE user_id = auth.uid()));
CREATE POLICY "creator_payouts_owner_insert" ON public.creator_payouts FOR INSERT
  WITH CHECK (creator_id IN (SELECT id FROM public.creator_profiles WHERE user_id = auth.uid()));

-- creator_memberships: public read, owner write
CREATE POLICY "creator_memberships_public_read" ON public.creator_memberships FOR SELECT USING (true);
CREATE POLICY "creator_memberships_owner_insert" ON public.creator_memberships FOR INSERT
  WITH CHECK (creator_id IN (SELECT id FROM public.creator_profiles WHERE user_id = auth.uid()));
CREATE POLICY "creator_memberships_owner_update" ON public.creator_memberships FOR UPDATE
  USING (creator_id IN (SELECT id FROM public.creator_profiles WHERE user_id = auth.uid()));

-- user_subscriptions: owner read/insert
CREATE POLICY "user_subscriptions_owner_read" ON public.user_subscriptions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "user_subscriptions_owner_insert" ON public.user_subscriptions FOR INSERT WITH CHECK (user_id = auth.uid());

-- tips: from_user write, creator read
CREATE POLICY "tips_user_insert" ON public.tips FOR INSERT WITH CHECK (from_user_id = auth.uid());
CREATE POLICY "tips_creator_read" ON public.tips FOR SELECT
  USING (creator_id IN (SELECT id FROM public.creator_profiles WHERE user_id = auth.uid()) OR from_user_id = auth.uid());

-- brand_partnerships: owner read/write
CREATE POLICY "brand_partnerships_owner_read" ON public.brand_partnerships FOR SELECT
  USING (creator_id IN (SELECT id FROM public.creator_profiles WHERE user_id = auth.uid()));
CREATE POLICY "brand_partnerships_owner_insert" ON public.brand_partnerships FOR INSERT
  WITH CHECK (creator_id IN (SELECT id FROM public.creator_profiles WHERE user_id = auth.uid()));
CREATE POLICY "brand_partnerships_owner_update" ON public.brand_partnerships FOR UPDATE
  USING (creator_id IN (SELECT id FROM public.creator_profiles WHERE user_id = auth.uid()));

-- creator_analytics: owner read
CREATE POLICY "creator_analytics_owner_read" ON public.creator_analytics FOR SELECT
  USING (creator_id IN (SELECT id FROM public.creator_profiles WHERE user_id = auth.uid()));

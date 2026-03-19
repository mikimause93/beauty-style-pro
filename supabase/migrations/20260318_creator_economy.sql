-- CREATOR PROFILES EXTENDED
CREATE TABLE IF NOT EXISTS creator_profiles (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  creator_tier TEXT CHECK (creator_tier IN ('free', 'verified', 'pro', 'partner')) DEFAULT 'free',
  total_followers INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  total_courses_sold INTEGER DEFAULT 0,
  total_live_views INTEGER DEFAULT 0,
  revenue_share_percentage INTEGER DEFAULT 70,
  minimum_payout DECIMAL(10,2) DEFAULT 50.00,
  payout_method TEXT,
  is_verified BOOLEAN DEFAULT false,
  verification_tier TEXT DEFAULT 'none',
  verified_at TIMESTAMPTZ,
  open_to_partnerships BOOLEAN DEFAULT true,
  partnership_rate DECIMAL(10,2),
  portfolio_url TEXT,
  instagram_handle TEXT,
  tiktok_handle TEXT,
  youtube_channel TEXT,
  analytics_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CREATOR EARNINGS
CREATE TABLE IF NOT EXISTS creator_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES creator_profiles(id) ON DELETE CASCADE,
  source_type TEXT CHECK (source_type IN ('course_sale','live_shopping','tip','sponsorship','membership','consultation')),
  source_id UUID,
  gross_amount DECIMAL(10,2),
  platform_fee DECIMAL(10,2),
  net_amount DECIMAL(10,2),
  status TEXT CHECK (status IN ('pending','approved','paid','cancelled')) DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  payout_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_creator_earnings_creator ON creator_earnings(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_earnings_status ON creator_earnings(status);

-- CREATOR PAYOUTS
CREATE TABLE IF NOT EXISTS creator_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES creator_profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'EUR',
  payout_method TEXT,
  payout_details JSONB,
  status TEXT CHECK (status IN ('pending','processing','completed','failed')) DEFAULT 'pending',
  stripe_payout_id TEXT,
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CREATOR MEMBERSHIPS
CREATE TABLE IF NOT EXISTS creator_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES creator_profiles(id) ON DELETE CASCADE,
  tier_name TEXT,
  tier_price DECIMAL(10,2),
  benefits JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- USER SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  membership_id UUID REFERENCES creator_memberships(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('active','cancelled','expired')) DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  stripe_subscription_id TEXT
);

-- TIPS
CREATE TABLE IF NOT EXISTS tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  to_creator_id UUID REFERENCES creator_profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2),
  message TEXT,
  post_id UUID,
  live_stream_id UUID,
  payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- BRAND PARTNERSHIPS
CREATE TABLE IF NOT EXISTS brand_partnerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES creator_profiles(id) ON DELETE CASCADE,
  brand_name TEXT,
  brand_contact_email TEXT,
  campaign_description TEXT,
  deliverables JSONB,
  payment_amount DECIMAL(10,2),
  platform_commission DECIMAL(10,2),
  status TEXT CHECK (status IN ('proposed','accepted','in_progress','completed','cancelled')) DEFAULT 'proposed',
  start_date DATE,
  end_date DATE,
  contract_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CREATOR ANALYTICS (daily snapshots)
CREATE TABLE IF NOT EXISTS creator_analytics (
  creator_id UUID REFERENCES creator_profiles(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  new_followers INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  total_likes INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  revenue_courses DECIMAL(10,2) DEFAULT 0,
  revenue_live DECIMAL(10,2) DEFAULT 0,
  revenue_tips DECIMAL(10,2) DEFAULT 0,
  revenue_memberships DECIMAL(10,2) DEFAULT 0,
  revenue_partnerships DECIMAL(10,2) DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  posts_created INTEGER DEFAULT 0,
  courses_published INTEGER DEFAULT 0,
  live_streams INTEGER DEFAULT 0,
  PRIMARY KEY (creator_id, date)
);

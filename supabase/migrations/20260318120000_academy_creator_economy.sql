-- ============================================
-- ACADEMY / FORMATION TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  preview_video_url TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  level TEXT NOT NULL DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  category TEXT NOT NULL DEFAULT 'professional' CHECK (category IN ('professional', 'client', 'newbie')),
  duration_minutes INTEGER DEFAULT 0,
  total_lessons INTEGER DEFAULT 0,
  enrolled_count INTEGER DEFAULT 0,
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  is_free BOOLEAN DEFAULT false,
  language TEXT DEFAULT 'it',
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Courses viewable by everyone" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Creators can manage own courses" ON public.courses FOR ALL USING (auth.uid() = creator_id);

CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  duration_seconds INTEGER DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 1,
  is_preview BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lessons viewable by everyone" ON public.lessons FOR SELECT USING (true);
CREATE POLICY "Course owners can manage lessons" ON public.lessons FOR ALL USING (
  EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND creator_id = auth.uid())
);

CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  completed_at TIMESTAMPTZ,
  payment_amount NUMERIC DEFAULT 0,
  payment_method TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own enrollments" ON public.enrollments FOR SELECT USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND creator_id = auth.uid())
);
CREATE POLICY "Users can enroll" ON public.enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own enrollment" ON public.enrollments FOR UPDATE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  watch_duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own lesson progress" ON public.lesson_progress FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  certificate_url TEXT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own certificates" ON public.certificates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can insert certificates" ON public.certificates FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.course_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);
ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews viewable by everyone" ON public.course_reviews FOR SELECT USING (true);
CREATE POLICY "Users can write reviews" ON public.course_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.course_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  revenue NUMERIC DEFAULT 0,
  enrollments INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  completions INTEGER DEFAULT 0,
  UNIQUE(course_id, date)
);
ALTER TABLE public.course_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Course owners can view analytics" ON public.course_analytics FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND creator_id = auth.uid())
);
CREATE POLICY "System can insert analytics" ON public.course_analytics FOR INSERT WITH CHECK (true);

-- ============================================
-- CREATOR ECONOMY TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.creator_profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  creator_tier TEXT NOT NULL DEFAULT 'free' CHECK (creator_tier IN ('free', 'verified', 'pro', 'partner')),
  total_followers INTEGER DEFAULT 0,
  total_revenue NUMERIC(10,2) DEFAULT 0,
  total_courses_sold INTEGER DEFAULT 0,
  total_live_views INTEGER DEFAULT 0,
  revenue_share_percentage INTEGER DEFAULT 70,
  minimum_payout NUMERIC(10,2) DEFAULT 50.00,
  payout_method TEXT CHECK (payout_method IN ('bank_transfer', 'paypal', 'stripe')),
  is_verified BOOLEAN DEFAULT false,
  verification_tier TEXT DEFAULT 'none' CHECK (verification_tier IN ('none', 'basic', 'advanced', 'partner')),
  verified_at TIMESTAMPTZ,
  open_to_partnerships BOOLEAN DEFAULT true,
  partnership_rate NUMERIC(10,2),
  portfolio_url TEXT,
  instagram_handle TEXT,
  tiktok_handle TEXT,
  youtube_channel TEXT,
  analytics_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creator profiles viewable by everyone" ON public.creator_profiles FOR SELECT USING (true);
CREATE POLICY "Creators can manage own profile" ON public.creator_profiles FOR ALL USING (auth.uid() = id);

CREATE TABLE IF NOT EXISTS public.creator_earnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('course_sale','live_shopping','tip','sponsorship','membership','consultation')),
  source_id UUID,
  gross_amount NUMERIC(10,2) NOT NULL,
  platform_fee NUMERIC(10,2) NOT NULL,
  net_amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','paid','cancelled')),
  paid_at TIMESTAMPTZ,
  payout_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.creator_earnings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can view own earnings" ON public.creator_earnings FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.creator_profiles WHERE id = creator_id AND id = auth.uid())
);
CREATE POLICY "System can insert earnings" ON public.creator_earnings FOR INSERT WITH CHECK (true);
CREATE INDEX idx_creator_earnings_creator ON public.creator_earnings(creator_id);
CREATE INDEX idx_creator_earnings_status ON public.creator_earnings(status);

CREATE TABLE IF NOT EXISTS public.creator_payouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  payout_method TEXT,
  payout_details JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  stripe_payout_id TEXT,
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.creator_payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can view own payouts" ON public.creator_payouts FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.creator_profiles WHERE id = creator_id AND id = auth.uid())
);
CREATE POLICY "Creators can request payouts" ON public.creator_payouts FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.creator_profiles WHERE id = creator_id AND id = auth.uid())
);

CREATE TABLE IF NOT EXISTS public.creator_memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  tier_name TEXT NOT NULL,
  tier_price NUMERIC(10,2) NOT NULL,
  benefits JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.creator_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Memberships viewable by everyone" ON public.creator_memberships FOR SELECT USING (true);
CREATE POLICY "Creators can manage own memberships" ON public.creator_memberships FOR ALL USING (
  EXISTS (SELECT 1 FROM public.creator_profiles WHERE id = creator_id AND id = auth.uid())
);

CREATE TABLE IF NOT EXISTS public.user_creator_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  membership_id UUID NOT NULL REFERENCES public.creator_memberships(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','cancelled','expired')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  stripe_subscription_id TEXT,
  UNIQUE(user_id, membership_id)
);
ALTER TABLE public.user_creator_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscriptions" ON public.user_creator_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can subscribe" ON public.user_creator_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscriptions" ON public.user_creator_subscriptions FOR UPDATE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.tips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  to_creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  message TEXT,
  post_id UUID,
  live_stream_id UUID,
  payment_intent_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tips readable by involved parties" ON public.tips FOR SELECT USING (
  auth.uid() = from_user_id OR auth.uid() = to_creator_id
);
CREATE POLICY "Users can send tips" ON public.tips FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE TABLE IF NOT EXISTS public.brand_partnerships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  brand_name TEXT NOT NULL,
  brand_contact_email TEXT,
  campaign_description TEXT,
  deliverables JSONB,
  payment_amount NUMERIC(10,2),
  platform_commission NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed','accepted','in_progress','completed','cancelled')),
  start_date DATE,
  end_date DATE,
  contract_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.brand_partnerships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can view own partnerships" ON public.brand_partnerships FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.creator_profiles WHERE id = creator_id AND id = auth.uid())
);
CREATE POLICY "Anyone can propose partnership" ON public.brand_partnerships FOR INSERT WITH CHECK (true);
CREATE POLICY "Creators can update own partnerships" ON public.brand_partnerships FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.creator_profiles WHERE id = creator_id AND id = auth.uid())
);

CREATE TABLE IF NOT EXISTS public.creator_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES public.creator_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  new_followers INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  total_likes INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  revenue_courses NUMERIC(10,2) DEFAULT 0,
  revenue_live NUMERIC(10,2) DEFAULT 0,
  revenue_tips NUMERIC(10,2) DEFAULT 0,
  revenue_memberships NUMERIC(10,2) DEFAULT 0,
  revenue_partnerships NUMERIC(10,2) DEFAULT 0,
  total_revenue NUMERIC(10,2) DEFAULT 0,
  posts_created INTEGER DEFAULT 0,
  courses_published INTEGER DEFAULT 0,
  live_streams INTEGER DEFAULT 0,
  UNIQUE(creator_id, date)
);
ALTER TABLE public.creator_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creators can view own analytics" ON public.creator_analytics FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.creator_profiles WHERE id = creator_id AND id = auth.uid())
);

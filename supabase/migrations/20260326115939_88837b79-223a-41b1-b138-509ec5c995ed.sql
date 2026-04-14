
-- ============================================
-- AI PREVIEW SYSTEM - Core Tables
-- ============================================

-- Preview sessions
CREATE TABLE IF NOT EXISTS public.preview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  sector TEXT NOT NULL DEFAULT 'hair',
  style_name TEXT,
  session_type TEXT DEFAULT 'single',
  original_image_url TEXT NOT NULL,
  generated_image_url TEXT,
  status TEXT DEFAULT 'uploading' CHECK (status IN ('uploading', 'processing', 'completed', 'failed')),
  ai_model_used TEXT,
  ai_prompt TEXT,
  confidence_score DECIMAL(3,2),
  processing_time_seconds INTEGER,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.preview_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preview sessions" ON public.preview_sessions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own preview sessions" ON public.preview_sessions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own preview sessions" ON public.preview_sessions
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE INDEX idx_preview_sessions_user ON public.preview_sessions(user_id);

-- AI Credits
CREATE TABLE IF NOT EXISTS public.ai_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  balance INTEGER DEFAULT 10,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'unlimited')),
  monthly_quota INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credits" ON public.ai_credits
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own credits" ON public.ai_credits
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own credits" ON public.ai_credits
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- AI Credit Transactions
CREATE TABLE IF NOT EXISTS public.ai_credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  transaction_type TEXT CHECK (transaction_type IN ('purchase', 'usage', 'refund', 'bonus', 'subscription')),
  amount INTEGER NOT NULL,
  balance_after INTEGER,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credit txns" ON public.ai_credit_transactions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own credit txns" ON public.ai_credit_transactions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Shop Vetrina (profile shops)
CREATE TABLE IF NOT EXISTS public.profile_shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  shop_name TEXT NOT NULL,
  shop_description TEXT,
  shop_logo_url TEXT,
  shop_banner_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  total_products INTEGER DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  avg_rating DECIMAL(3,2) DEFAULT 0.0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profile_shops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active shops" ON public.profile_shops
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can manage own shop" ON public.profile_shops
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- AI Voice Sessions (Stella Advanced)
CREATE TABLE IF NOT EXISTS public.ai_voice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_type TEXT DEFAULT 'voice_command' CHECK (session_type IN ('wake_word', 'voice_command', 'conversation', 'background')),
  transcription TEXT,
  intent TEXT,
  entities JSONB,
  response TEXT,
  action_taken TEXT,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_voice_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own voice sessions" ON public.ai_voice_sessions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own voice sessions" ON public.ai_voice_sessions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- AI Proactive Suggestions
CREATE TABLE IF NOT EXISTS public.ai_proactive_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  suggestion_type TEXT CHECK (suggestion_type IN (
    'booking_reminder', 'follow_creator', 'try_preview',
    'complete_profile', 'purchase_credits', 'check_messages'
  )),
  suggestion_text TEXT,
  suggestion_data JSONB,
  action_url TEXT,
  priority INTEGER DEFAULT 0,
  shown_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ai_proactive_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own suggestions" ON public.ai_proactive_suggestions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can update own suggestions" ON public.ai_proactive_suggestions
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Function to initialize AI credits for new users
CREATE OR REPLACE FUNCTION public.init_ai_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.ai_credits (user_id, balance, plan, monthly_quota)
  VALUES (NEW.user_id, 10, 'free', 10)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger: auto-create AI credits when profile is created
DROP TRIGGER IF EXISTS trigger_init_ai_credits ON public.profiles;
CREATE TRIGGER trigger_init_ai_credits
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.init_ai_credits();

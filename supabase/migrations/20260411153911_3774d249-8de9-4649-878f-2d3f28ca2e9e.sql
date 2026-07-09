
-- Content Calendar for social media scheduling
CREATE TABLE public.content_calendar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL DEFAULT 'instagram',
  content_text TEXT,
  media_url TEXT,
  media_type TEXT DEFAULT 'image',
  hashtags TEXT[] DEFAULT '{}',
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft',
  ai_generated BOOLEAN DEFAULT false,
  ai_prompt TEXT,
  engagement_score NUMERIC DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.content_calendar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own content calendar"
  ON public.content_calendar FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_content_calendar_tenant ON public.content_calendar(tenant_id);
CREATE INDEX idx_content_calendar_scheduled ON public.content_calendar(scheduled_at);
CREATE INDEX idx_content_calendar_status ON public.content_calendar(status);

-- Social Accounts linked per tenant
CREATE TABLE public.social_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  account_name TEXT,
  account_id TEXT,
  follower_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own social accounts"
  ON public.social_accounts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Social Analytics per post
CREATE TABLE public.social_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID REFERENCES public.content_calendar(id) ON DELETE CASCADE,
  impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.social_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own social analytics"
  ON public.social_analytics FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.content_calendar cc
    WHERE cc.id = content_id AND cc.user_id = auth.uid()
  ));

-- Predictive Insights
CREATE TABLE public.predictive_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  insight_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  prediction_data JSONB DEFAULT '{}',
  confidence_score NUMERIC DEFAULT 0,
  timeframe TEXT,
  status TEXT DEFAULT 'active',
  action_taken BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.predictive_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own predictive insights"
  ON public.predictive_insights FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Website Pages (mini-site generator)
CREATE TABLE public.website_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  page_type TEXT NOT NULL DEFAULT 'home',
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  content_html TEXT,
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT[],
  og_image TEXT,
  published BOOLEAN DEFAULT false,
  custom_domain TEXT,
  template TEXT DEFAULT 'modern',
  styles JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, slug)
);

ALTER TABLE public.website_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own website pages"
  ON public.website_pages FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Published pages are public"
  ON public.website_pages FOR SELECT
  USING (published = true);

-- White-label Configs
CREATE TABLE public.whitelabel_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL,
  brand_name TEXT NOT NULL,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#8B5CF6',
  secondary_color TEXT DEFAULT '#D946EF',
  custom_domain TEXT,
  reseller_commission NUMERIC DEFAULT 20,
  max_tenants INTEGER DEFAULT 50,
  features_enabled TEXT[] DEFAULT '{social,booking,shop,ai}',
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.whitelabel_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency owners manage own whitelabel"
  ON public.whitelabel_configs FOR ALL
  USING (auth.uid() = agency_id)
  WITH CHECK (auth.uid() = agency_id);

-- Triggers for updated_at
CREATE TRIGGER update_content_calendar_updated_at
  BEFORE UPDATE ON public.content_calendar
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_social_accounts_updated_at
  BEFORE UPDATE ON public.social_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_predictive_insights_updated_at
  BEFORE UPDATE ON public.predictive_insights
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_website_pages_updated_at
  BEFORE UPDATE ON public.website_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whitelabel_configs_updated_at
  BEFORE UPDATE ON public.whitelabel_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

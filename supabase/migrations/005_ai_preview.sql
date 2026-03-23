-- Migration: 005_ai_preview.sql
-- AI Preview Tables for Beauty Style Pro 4.0 ULTRA ENTERPRISE
-- See pasted.txt at repository root for the full canonical specification

-- AI Preview Sessions
CREATE TABLE IF NOT EXISTS public.ai_preview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  original_image_url TEXT,
  style_prompt TEXT NOT NULL,
  result_image_url TEXT,
  model_used TEXT DEFAULT 'stability-ai/stable-diffusion-xl-1.0',
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- AI Preview Styles Catalog
CREATE TABLE IF NOT EXISTS public.ai_preview_styles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('hair', 'makeup', 'nails', 'skincare')),
  thumbnail_url TEXT,
  prompt_template TEXT NOT NULL,
  is_premium BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI Preview Favorites
CREATE TABLE IF NOT EXISTS public.ai_preview_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.ai_preview_sessions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, session_id)
);

-- AI Preview Usage Tracking (per-user, per-day)
CREATE TABLE IF NOT EXISTS public.ai_preview_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  free_previews_used INTEGER DEFAULT 0,
  paid_previews_used INTEGER DEFAULT 0,
  UNIQUE (user_id, date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_preview_sessions_user_id ON public.ai_preview_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_ai_preview_sessions_status ON public.ai_preview_sessions (status);
CREATE INDEX IF NOT EXISTS idx_ai_preview_favorites_user_id ON public.ai_preview_favorites (user_id);
CREATE INDEX IF NOT EXISTS idx_ai_preview_usage_user_date ON public.ai_preview_usage (user_id, date);

-- Enable Row Level Security
ALTER TABLE public.ai_preview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_preview_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_preview_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_preview_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- ai_preview_sessions: users can only manage their own sessions
CREATE POLICY "Users can manage own preview sessions"
  ON public.ai_preview_sessions FOR ALL
  USING (auth.uid() = user_id);

-- ai_preview_styles: publicly readable, no writes by users
CREATE POLICY "AI preview styles are publicly readable"
  ON public.ai_preview_styles FOR SELECT
  USING (true);

-- ai_preview_favorites: users can manage their own favorites
CREATE POLICY "Users can manage own favorites"
  ON public.ai_preview_favorites FOR ALL
  USING (auth.uid() = user_id);

-- ai_preview_usage: users can view and update their own usage
CREATE POLICY "Users can view own usage"
  ON public.ai_preview_usage FOR ALL
  USING (auth.uid() = user_id);

-- Helper function to increment AI preview usage
CREATE OR REPLACE FUNCTION public.increment_ai_preview_usage(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.ai_preview_usage (user_id, date, free_previews_used)
  VALUES (p_user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, date)
  DO UPDATE SET free_previews_used = ai_preview_usage.free_previews_used + 1;
END;
$$;

-- Seed some initial styles
INSERT INTO public.ai_preview_styles (name, description, category, prompt_template, is_premium, sort_order) VALUES
  ('Natural Balayage', 'Soft, sun-kissed highlights for a natural look', 'hair', 'natural balayage highlights, soft waves, professional salon photo', false, 1),
  ('Bold Ombre', 'Dramatic color transition from dark roots to light ends', 'hair', 'bold ombre hair color, dark roots to blonde tips, high contrast', false, 2),
  ('Classic Bob', 'Timeless chin-length bob haircut', 'hair', 'classic bob haircut, sleek straight hair, professional portrait', false, 3),
  ('Smoky Eye', 'Dramatic smoky eye makeup look', 'makeup', 'smoky eye makeup, professional beauty photo, dramatic look', false, 4),
  ('Natural Glow', 'Fresh, dewy natural makeup look', 'makeup', 'natural makeup look, dewy skin, fresh faced beauty portrait', false, 5),
  ('French Tips', 'Classic French manicure nail art', 'nails', 'french tip manicure, clean nails, close-up hand photo', false, 6),
  ('Glass Skin', 'Ultra-smooth, reflective glass skin effect', 'skincare', 'glass skin effect, flawless complexion, beauty portrait', true, 7),
  ('Curtain Bangs', 'Trendy face-framing curtain bangs', 'hair', 'curtain bangs hairstyle, face framing, trendy haircut portrait', true, 8)
ON CONFLICT DO NOTHING;

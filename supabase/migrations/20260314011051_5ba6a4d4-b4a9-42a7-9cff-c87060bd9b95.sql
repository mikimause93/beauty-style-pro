
-- AI Look Generator tables
CREATE TABLE public.look_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  original_photo_url TEXT NOT NULL,
  generated_photo_url TEXT,
  styles_applied JSONB NOT NULL DEFAULT '[]'::jsonb,
  categories TEXT[] NOT NULL DEFAULT '{}',
  prompt_used TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.look_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own generations"
  ON public.look_generations FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own generations"
  ON public.look_generations FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own generations"
  ON public.look_generations FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own generations"
  ON public.look_generations FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Storage bucket for look photos
INSERT INTO storage.buckets (id, name, public) VALUES ('look-photos', 'look-photos', true);

CREATE POLICY "Users can upload look photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'look-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view look photos"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'look-photos');

CREATE POLICY "Users can delete own look photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'look-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

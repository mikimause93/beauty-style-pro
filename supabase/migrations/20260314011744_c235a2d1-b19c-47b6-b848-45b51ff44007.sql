
-- Professional sectors system
CREATE TABLE public.professional_sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL DEFAULT '💇',
  description TEXT,
  parent_sector TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.professional_sectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view sectors"
  ON public.professional_sectors FOR SELECT TO public
  USING (active = true);

-- Insert all sectors
INSERT INTO public.professional_sectors (name, slug, icon, sort_order) VALUES
  ('Barbiere', 'barbiere', '💈', 1),
  ('Parrucchiere', 'parrucchiere', '✂️', 2),
  ('Estetica', 'estetica', '💆', 3),
  ('Tattoo', 'tattoo', '🖋️', 4),
  ('Chirurgia Estetica', 'chirurgia-estetica', '🏥', 5),
  ('Bellezza', 'bellezza', '💄', 6),
  ('Moda', 'moda', '👗', 7),
  ('Abbigliamento', 'abbigliamento', '👔', 8),
  ('Profumi', 'profumi', '🌸', 9),
  ('Makeup', 'makeup', '💋', 10),
  ('Accessori', 'accessori', '👜', 11),
  ('Dentista Estetico', 'dentista-estetico', '🦷', 12),
  ('Cliniche', 'cliniche', '🏥', 13),
  ('Spa', 'spa', '🧖', 14),
  ('Benessere', 'benessere', '🧘', 15),
  ('Fitness', 'fitness', '💪', 16),
  ('Influencer', 'influencer', '📸', 17),
  ('Brand', 'brand', '🏷️', 18),
  ('Negozi', 'negozi', '🏪', 19),
  ('Servizi', 'servizi', '🔧', 20);

-- Add sector column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sector TEXT;

-- Add sector and ai_preview_enabled to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sector TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS ai_preview_enabled BOOLEAN NOT NULL DEFAULT false;

-- Add sector to posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS sector TEXT;

-- Add ai_preview_enabled to services
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS ai_preview_enabled BOOLEAN NOT NULL DEFAULT false;

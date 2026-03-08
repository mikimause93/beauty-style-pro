
-- Transformation challenges table
CREATE TABLE public.transformation_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'hairstyle',
  technique TEXT,
  before_image_url TEXT,
  process_video_url TEXT,
  after_image_url TEXT,
  style_name TEXT,
  estimated_price NUMERIC,
  estimated_duration TEXT,
  products_used TEXT[] DEFAULT '{}',
  replicable BOOLEAN DEFAULT true,
  vote_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  qr_coin_received NUMERIC DEFAULT 0,
  booking_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transformation_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Transformation challenges viewable by everyone" ON public.transformation_challenges
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create challenges" ON public.transformation_challenges
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own challenges" ON public.transformation_challenges
  FOR UPDATE USING (auth.uid() = creator_id);

-- Challenge votes table
CREATE TABLE public.challenge_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.transformation_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  vote_type TEXT NOT NULL DEFAULT 'upvote',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

ALTER TABLE public.challenge_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Votes viewable by everyone" ON public.challenge_votes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote" ON public.challenge_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own vote" ON public.challenge_votes
  FOR DELETE USING (auth.uid() = user_id);

-- Challenge donations (QRCoin tips)
CREATE TABLE public.challenge_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.transformation_challenges(id) ON DELETE CASCADE,
  donor_id UUID NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.challenge_donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Donations viewable by everyone" ON public.challenge_donations
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can donate" ON public.challenge_donations
  FOR INSERT WITH CHECK (auth.uid() = donor_id);

-- Trigger to update vote count
CREATE OR REPLACE FUNCTION public.update_challenge_vote_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.transformation_challenges SET vote_count = vote_count + 1 WHERE id = NEW.challenge_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.transformation_challenges SET vote_count = GREATEST(vote_count - 1, 0) WHERE id = OLD.challenge_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_challenge_vote_insert
  AFTER INSERT ON public.challenge_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_challenge_vote_count();

CREATE TRIGGER on_challenge_vote_delete
  AFTER DELETE ON public.challenge_votes
  FOR EACH ROW EXECUTE FUNCTION public.update_challenge_vote_count();

-- Trigger to update donation total
CREATE OR REPLACE FUNCTION public.update_challenge_donation_total()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.transformation_challenges SET qr_coin_received = qr_coin_received + NEW.amount WHERE id = NEW.challenge_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_challenge_donation
  AFTER INSERT ON public.challenge_donations
  FOR EACH ROW EXECUTE FUNCTION public.update_challenge_donation_total();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.transformation_challenges;
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenge_votes;

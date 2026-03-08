
-- Live Battles table
CREATE TABLE public.live_battles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID REFERENCES public.live_streams(id) ON DELETE CASCADE,
  host_a_id UUID NOT NULL,
  host_b_id UUID NOT NULL,
  host_a_name TEXT NOT NULL DEFAULT '',
  host_b_name TEXT NOT NULL DEFAULT '',
  host_a_thumbnail TEXT,
  host_b_thumbnail TEXT,
  score_a INTEGER NOT NULL DEFAULT 0,
  score_b INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'waiting',
  category TEXT DEFAULT 'taglio',
  winner_id UUID,
  prize_pool NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Battle Votes table
CREATE TABLE public.battle_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  battle_id UUID NOT NULL REFERENCES public.live_battles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  voted_for UUID NOT NULL,
  qr_coin_amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(battle_id, user_id)
);

-- RLS
ALTER TABLE public.live_battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Battles viewable by everyone" ON public.live_battles FOR SELECT USING (true);
CREATE POLICY "Hosts can create battles" ON public.live_battles FOR INSERT WITH CHECK (auth.uid() = host_a_id);
CREATE POLICY "Hosts can update battles" ON public.live_battles FOR UPDATE USING (auth.uid() = host_a_id OR auth.uid() = host_b_id);

CREATE POLICY "Votes viewable by everyone" ON public.battle_votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can vote" ON public.battle_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger to update scores
CREATE OR REPLACE FUNCTION public.update_battle_score()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.voted_for = (SELECT host_a_id FROM public.live_battles WHERE id = NEW.battle_id) THEN
    UPDATE public.live_battles SET score_a = score_a + 1 + COALESCE(NEW.qr_coin_amount, 0)::integer WHERE id = NEW.battle_id;
  ELSE
    UPDATE public.live_battles SET score_b = score_b + 1 + COALESCE(NEW.qr_coin_amount, 0)::integer WHERE id = NEW.battle_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_battle_vote
AFTER INSERT ON public.battle_votes
FOR EACH ROW EXECUTE FUNCTION public.update_battle_score();

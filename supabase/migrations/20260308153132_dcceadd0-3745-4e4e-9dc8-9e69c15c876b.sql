
-- Add new columns to live_streams for session setup
ALTER TABLE public.live_streams
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'tutorial',
  ADD COLUMN IF NOT EXISTS qr_coin_pool numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS interaction_goal integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS replay_cost numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_duration_minutes integer DEFAULT 60;

-- Add interaction tracking to stream_viewers
ALTER TABLE public.stream_viewers
  ADD COLUMN IF NOT EXISTS interaction_score integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS qr_coin_earned numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS invited_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS badges text[] DEFAULT '{}';

-- Create live_polls table for in-stream polls
CREATE TABLE IF NOT EXISTS public.live_polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]',
  results jsonb NOT NULL DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);

ALTER TABLE public.live_polls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Polls viewable by everyone" ON public.live_polls FOR SELECT USING (true);
CREATE POLICY "Stream owners can create polls" ON public.live_polls FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM live_streams ls
    JOIN professionals p ON p.id = ls.professional_id
    WHERE ls.id = live_polls.stream_id AND p.user_id = auth.uid()
  ));
CREATE POLICY "Stream owners can update polls" ON public.live_polls FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM live_streams ls
    JOIN professionals p ON p.id = ls.professional_id
    WHERE ls.id = live_polls.stream_id AND p.user_id = auth.uid()
  ));

-- Create poll_votes table
CREATE TABLE IF NOT EXISTS public.poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.live_polls(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  option_index integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(poll_id, user_id)
);

ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Votes viewable by everyone" ON public.poll_votes FOR SELECT USING (true);
CREATE POLICY "Users can vote" ON public.poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create live_invites table for viral loop
CREATE TABLE IF NOT EXISTS public.live_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  inviter_id uuid NOT NULL,
  invited_id uuid NOT NULL,
  bonus_awarded boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(stream_id, inviter_id, invited_id)
);

ALTER TABLE public.live_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Invites viewable by participants" ON public.live_invites FOR SELECT
  USING (auth.uid() = inviter_id OR auth.uid() = invited_id);
CREATE POLICY "Users can create invites" ON public.live_invites FOR INSERT
  WITH CHECK (auth.uid() = inviter_id);

-- Enable realtime for polls
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_polls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_votes;

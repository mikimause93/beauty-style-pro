
-- LIVE STREAMING
CREATE TABLE public.live_streams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid REFERENCES public.professionals(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  thumbnail_url text,
  stream_url text,
  stream_key text,
  status text NOT NULL DEFAULT 'scheduled',
  scheduled_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  viewer_count int NOT NULL DEFAULT 0,
  peak_viewers int NOT NULL DEFAULT 0,
  total_views int NOT NULL DEFAULT 0,
  total_earnings numeric NOT NULL DEFAULT 0,
  total_tips numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.stream_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reaction_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.stream_tips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.stream_viewers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz,
  duration int
);

CREATE TABLE public.stream_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  message text NOT NULL,
  is_pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- LEADERBOARD
CREATE TABLE public.leaderboard (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  leaderboard_type text NOT NULL,
  period text NOT NULL DEFAULT 'monthly',
  score int NOT NULL DEFAULT 0,
  rank int,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, leaderboard_type, period)
);

-- BADGES
CREATE TABLE public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  category text NOT NULL,
  rarity text NOT NULL DEFAULT 'common',
  criteria jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- RADIO & MUSIC
CREATE TABLE public.radio_stations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  cover_image text,
  stream_url text NOT NULL,
  genre text NOT NULL,
  language text NOT NULL DEFAULT 'IT',
  active boolean NOT NULL DEFAULT true,
  featured boolean NOT NULL DEFAULT false,
  listener_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id uuid REFERENCES public.radio_stations(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  cover_image text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id uuid NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  title text NOT NULL,
  artist text NOT NULL,
  duration int NOT NULL,
  audio_url text NOT NULL,
  cover_image text,
  play_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- REFERRALS
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id uuid NOT NULL REFERENCES public.referral_codes(id) ON DELETE CASCADE,
  referrer_id uuid NOT NULL,
  referred_id uuid NOT NULL,
  reward_claimed boolean NOT NULL DEFAULT false,
  claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- AR FILTERS
CREATE TABLE public.ar_filters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid,
  name text NOT NULL,
  description text,
  preview_image text NOT NULL,
  filter_data jsonb NOT NULL DEFAULT '{}',
  category text NOT NULL,
  usage_count int NOT NULL DEFAULT 0,
  featured boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS POLICIES
ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_viewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radio_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ar_filters ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Live streams viewable by everyone" ON public.live_streams FOR SELECT USING (true);
CREATE POLICY "Stream reactions viewable by everyone" ON public.stream_reactions FOR SELECT USING (true);
CREATE POLICY "Stream comments viewable by everyone" ON public.stream_comments FOR SELECT USING (true);
CREATE POLICY "Leaderboard viewable by everyone" ON public.leaderboard FOR SELECT USING (true);
CREATE POLICY "Badges viewable by everyone" ON public.badges FOR SELECT USING (true);
CREATE POLICY "User badges viewable by everyone" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "Radio stations viewable by everyone" ON public.radio_stations FOR SELECT USING (true);
CREATE POLICY "Playlists viewable by everyone" ON public.playlists FOR SELECT USING (true);
CREATE POLICY "Tracks viewable by everyone" ON public.tracks FOR SELECT USING (true);
CREATE POLICY "AR filters viewable by everyone" ON public.ar_filters FOR SELECT USING (true);
CREATE POLICY "Referrals viewable by owner" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
CREATE POLICY "Stream tips viewable by everyone" ON public.stream_tips FOR SELECT USING (true);
CREATE POLICY "Stream viewers viewable by everyone" ON public.stream_viewers FOR SELECT USING (true);

-- Auth insert policies
CREATE POLICY "Users can create streams" ON public.live_streams FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM professionals WHERE professionals.user_id = auth.uid() AND professionals.id = live_streams.professional_id));
CREATE POLICY "Users can update own streams" ON public.live_streams FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM professionals WHERE professionals.user_id = auth.uid() AND professionals.id = live_streams.professional_id));
CREATE POLICY "Users can react" ON public.stream_reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can tip" ON public.stream_tips FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can join stream" ON public.stream_viewers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can comment on stream" ON public.stream_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can create referrals" ON public.referrals FOR INSERT TO authenticated WITH CHECK (auth.uid() = referred_id);

-- Enable realtime for live streaming
ALTER PUBLICATION supabase_realtime ADD TABLE public.stream_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stream_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stream_tips;

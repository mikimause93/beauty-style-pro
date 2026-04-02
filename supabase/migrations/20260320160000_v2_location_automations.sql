-- ============================================================
-- Beauty Style Pro v2.0.0 — Location Live + Automations
-- Migration: tabelle location realtime, geofences e automazioni
-- ============================================================

-- 1. Sessioni di tracking GPS
CREATE TABLE IF NOT EXISTS public.location_sessions (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at  timestamptz NOT NULL DEFAULT now(),
  ended_at    timestamptz,
  precision   text NOT NULL DEFAULT 'EXACT' CHECK (precision IN ('EXACT', 'AREA', 'CITY')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.location_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own location sessions"
  ON public.location_sessions
  FOR ALL
  USING (auth.uid() = user_id);

-- 2. Punti di posizione
CREATE TABLE IF NOT EXISTS public.location_points (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id  uuid NOT NULL REFERENCES public.location_sessions(id) ON DELETE CASCADE,
  lat         double precision NOT NULL,
  lng         double precision NOT NULL,
  accuracy    double precision,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.location_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own location points"
  ON public.location_points
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.location_sessions ls
      WHERE ls.id = location_points.session_id
        AND ls.user_id = auth.uid()
    )
  );

-- Indice per Realtime e query recenti
CREATE INDEX IF NOT EXISTS idx_location_points_session_time
  ON public.location_points (session_id, created_at DESC);

-- 3. Geofences
CREATE TABLE IF NOT EXISTS public.geofences (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         text NOT NULL,
  lat          double precision NOT NULL,
  lng          double precision NOT NULL,
  radius_m     integer NOT NULL DEFAULT 500,
  trigger_type text NOT NULL DEFAULT 'enter' CHECK (trigger_type IN ('enter', 'exit', 'both')),
  active       boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.geofences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own geofences"
  ON public.geofences
  FOR ALL
  USING (auth.uid() = owner_id);

-- 4. Condivisione posizione con scadenza
CREATE TABLE IF NOT EXISTS public.location_shares (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at       timestamptz NOT NULL,
  precision_level  text NOT NULL DEFAULT 'AREA' CHECK (precision_level IN ('EXACT', 'AREA', 'CITY')),
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.location_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Share participants can view location shares"
  ON public.location_shares
  FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Sender can create location shares"
  ON public.location_shares
  FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Sender can delete own location shares"
  ON public.location_shares
  FOR DELETE
  USING (auth.uid() = from_user_id);

-- 5. Regole di automazione (Rules Engine)
CREATE TABLE IF NOT EXISTS public.automation_rules (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  active      boolean NOT NULL DEFAULT true,
  trigger     text NOT NULL,
  conditions  jsonb NOT NULL DEFAULT '[]',
  actions     jsonb NOT NULL DEFAULT '[]',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own automation rules"
  ON public.automation_rules
  FOR ALL
  USING (auth.uid() = owner_id);

-- Trigger updated_at automatico per automation_rules e geofences
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_automation_rules_updated_at
  BEFORE UPDATE ON public.automation_rules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_geofences_updated_at
  BEFORE UPDATE ON public.geofences
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Abilita Realtime per location_points (aggiornamenti live)
ALTER PUBLICATION supabase_realtime ADD TABLE public.location_points;
ALTER PUBLICATION supabase_realtime ADD TABLE public.location_sessions;

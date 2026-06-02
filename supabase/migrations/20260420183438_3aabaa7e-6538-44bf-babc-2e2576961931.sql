-- Enable realtime for messaging and notifications
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.messages; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- WebRTC signaling table for in-app audio/video calls
CREATE TABLE IF NOT EXISTS public.call_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL,
  from_user UUID NOT NULL,
  to_user UUID NOT NULL,
  signal_type TEXT NOT NULL, -- 'offer' | 'answer' | 'ice' | 'ringing' | 'accept' | 'reject' | 'hangup'
  payload JSONB,
  call_kind TEXT DEFAULT 'video', -- 'audio' | 'video'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_call_signals_to_user ON public.call_signals(to_user, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_signals_call ON public.call_signals(call_id, created_at);

ALTER TABLE public.call_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read signals addressed to them or sent by them"
ON public.call_signals FOR SELECT TO authenticated
USING (auth.uid() = to_user OR auth.uid() = from_user);

CREATE POLICY "Users can send signals as themselves"
ON public.call_signals FOR INSERT TO authenticated
WITH CHECK (auth.uid() = from_user);

CREATE POLICY "Users can delete their own call signals"
ON public.call_signals FOR DELETE TO authenticated
USING (auth.uid() = from_user OR auth.uid() = to_user);

ALTER TABLE public.call_signals REPLICA IDENTITY FULL;
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.call_signals; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- Auto-cleanup old signals (older than 1 hour) to keep table small
CREATE OR REPLACE FUNCTION public.cleanup_old_call_signals()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM public.call_signals WHERE created_at < now() - INTERVAL '1 hour';
$$;
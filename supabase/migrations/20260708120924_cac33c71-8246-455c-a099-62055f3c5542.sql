
-- ============================================================
-- Impostazioni segreteria/auto-risposta Stella per le chiamate
-- ============================================================
CREATE TABLE public.call_auto_answer_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  mode text NOT NULL DEFAULT 'off' CHECK (mode IN ('off','schedule','always')),
  schedule jsonb NOT NULL DEFAULT jsonb_build_object(
    'days', jsonb_build_array(1,2,3,4,5),
    'from', '20:00',
    'to', '08:00',
    'timezone', 'Europe/Rome'
  ),
  greeting_text text NOT NULL DEFAULT 'Ciao, sono Stella, l''assistente AI. Al momento non posso rispondere di persona. Come posso aiutarti? Posso fornirti informazioni, prendere un appuntamento o lasciare un messaggio.',
  greeting_voice text NOT NULL DEFAULT 'EXAVITQu4vr4xnSDxMaL',
  auto_book_enabled boolean NOT NULL DEFAULT true,
  take_message_enabled boolean NOT NULL DEFAULT true,
  transfer_enabled boolean NOT NULL DEFAULT true,
  translation_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.call_auto_answer_settings TO authenticated;
GRANT ALL ON public.call_auto_answer_settings TO service_role;
-- lettura pubblica limitata al campo mode per sapere se auto-risposta attiva
GRANT SELECT ON public.call_auto_answer_settings TO anon;

ALTER TABLE public.call_auto_answer_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auto_answer_owner_all"
  ON public.call_auto_answer_settings FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "auto_answer_read_status"
  ON public.call_auto_answer_settings FOR SELECT TO authenticated, anon
  USING (true);

CREATE TRIGGER trg_auto_answer_updated_at
  BEFORE UPDATE ON public.call_auto_answer_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- Sessioni di risposta AI Stella (log conversazione con il chiamante)
-- ============================================================
CREATE TABLE public.stella_call_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id text NOT NULL,
  target_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  caller_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  caller_name text,
  transcript jsonb NOT NULL DEFAULT '[]'::jsonb,
  outcome text NOT NULL DEFAULT 'ongoing' CHECK (outcome IN ('ongoing','info','booking','message','transferred','ended')),
  booking_id uuid,
  message_conversation_id uuid,
  language text,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_stella_call_sessions_target ON public.stella_call_sessions(target_user_id, started_at DESC);
CREATE INDEX idx_stella_call_sessions_caller ON public.stella_call_sessions(caller_user_id, started_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.stella_call_sessions TO authenticated;
GRANT ALL ON public.stella_call_sessions TO service_role;

ALTER TABLE public.stella_call_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "call_sessions_owner_read"
  ON public.stella_call_sessions FOR SELECT TO authenticated
  USING (auth.uid() = target_user_id OR auth.uid() = caller_user_id);

CREATE POLICY "call_sessions_caller_insert"
  ON public.stella_call_sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = caller_user_id);

CREATE POLICY "call_sessions_participants_update"
  ON public.stella_call_sessions FOR UPDATE TO authenticated
  USING (auth.uid() = target_user_id OR auth.uid() = caller_user_id);

CREATE TRIGGER trg_stella_call_sessions_updated_at
  BEFORE UPDATE ON public.stella_call_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

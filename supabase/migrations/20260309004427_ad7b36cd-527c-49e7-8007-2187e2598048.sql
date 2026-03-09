-- Tabella per trackare le azioni dell'utente
CREATE TABLE public.user_actions_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL, -- 'login', 'post_create', 'live_start', 'booking_create', 'wallet_use', etc.
  action_data JSONB DEFAULT '{}',
  page_context TEXT, -- quale pagina/sezione dell'app
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabella per i messaggi del chatbot
CREATE TABLE public.chatbot_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  message_type TEXT NOT NULL, -- 'suggestion', 'welcome', 'reminder', 'help'
  content TEXT NOT NULL,
  action_buttons JSONB DEFAULT '[]', -- bottoni di azione suggeriti
  shown_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  clicked_at TIMESTAMP WITH TIME ZONE,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'shown' -- 'shown', 'clicked', 'dismissed', 'expired'
);

-- Tabella per le configurazioni dei suggerimenti
CREATE TABLE public.chatbot_suggestions_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_type TEXT NOT NULL, -- 'client', 'professional', 'business'
  trigger_conditions JSONB NOT NULL, -- condizioni che attivano il suggerimento
  suggestion_template TEXT NOT NULL,
  priority INTEGER DEFAULT 1, -- priorità del suggerimento
  max_frequency_hours INTEGER DEFAULT 24, -- max una volta ogni X ore
  requires_actions TEXT[] DEFAULT '{}', -- azioni prerequisite
  excludes_actions TEXT[] DEFAULT '{}', -- azioni che escludono questo suggerimento
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabella per il tracking dei suggerimenti mostrati
CREATE TABLE public.user_suggestion_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  suggestion_type TEXT NOT NULL,
  last_shown_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  times_shown INTEGER DEFAULT 1,
  times_clicked INTEGER DEFAULT 0,
  times_dismissed INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.user_actions_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_suggestions_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_suggestion_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies per user_actions_tracking
CREATE POLICY "Users can view their own actions"
ON public.user_actions_tracking FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own actions"
ON public.user_actions_tracking FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies per chatbot_messages
CREATE POLICY "Users can view their own chatbot messages"
ON public.chatbot_messages FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own chatbot messages"
ON public.chatbot_messages FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies per user_suggestion_history
CREATE POLICY "Users can view their own suggestion history"
ON public.user_suggestion_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own suggestion history"
ON public.user_suggestion_history FOR ALL
USING (auth.uid() = user_id);

-- Configurazioni pubblicamente leggibili (ma solo admin possono modificare)
CREATE POLICY "Everyone can view chatbot configs"
ON public.chatbot_suggestions_config FOR SELECT
USING (true);

-- Insert configurazioni iniziali per i suggerimenti
INSERT INTO public.chatbot_suggestions_config (user_type, trigger_conditions, suggestion_template, priority, max_frequency_hours, requires_actions, excludes_actions) VALUES
-- Suggerimenti per clienti
('client', '{"days_since_login": 0, "posts_count": 0}', 'Benvenuto su Stayle! 🌟 Vuoi iniziare pubblicando il tuo primo post beauty?', 10, 24, '{}', '{"post_create"}'),
('client', '{"booking_count": 0, "days_active": 3}', 'Ti sei mai chiesto come prenotare con i migliori professionisti? 💫 Prova la ricerca nelle tue vicinanze!', 8, 48, '{}', '{"booking_create"}'),
('client', '{"qr_coins": 0, "days_active": 1}', 'Sapevi che puoi guadagnare QR Coins interagendo con l''app? 💰 Scopri come nel tuo wallet!', 6, 72, '{}', '{"wallet_visit"}'),

-- Suggerimenti per professionisti  
('professional', '{"posts_count": 0, "days_active": 1}', 'I professionisti con contenuti ricevono 3x più prenotazioni! 📸 Condividi il tuo lavoro ora', 9, 12, '{}', '{"post_create"}'),
('professional', '{"live_streams_count": 0, "days_active": 2}', 'Le Live generano 5x più engagement! 🎥 Vai live ora e fatti vedere dai clienti', 8, 24, '{}', '{"live_start"}'),
('professional', '{"subscription_active": false, "booking_count": 3}', 'Con Stayle Pro ottieni priorità nei risultati! 👑 Scopri i vantaggi Premium', 7, 168, '{}', '{"subscription_upgrade"}'),

-- Suggerimenti generali
('client', '{"notifications_unread": ">0"}', 'Hai {notifications_count} notifiche non lette! 🔔 Vuoi dare un''occhiata?', 5, 6, '{}', '{}'),
('professional', '{"profile_completion": "<80"}', 'Un profilo completo attira più clienti! ✨ Completa le informazioni mancanti', 6, 48, '{}', '{"profile_complete"}');

-- Function per tracciare azioni utente
CREATE OR REPLACE FUNCTION public.track_user_action(_user_id UUID, _action_type TEXT, _action_data JSONB DEFAULT '{}', _page_context TEXT DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_actions_tracking (user_id, action_type, action_data, page_context)
  VALUES (_user_id, _action_type, _action_data, _page_context);
END;
$$;

-- Function per ottenere suggerimenti personalizzati
CREATE OR REPLACE FUNCTION public.get_chatbot_suggestions(_user_id UUID)
RETURNS TABLE(
  suggestion_id UUID,
  message_type TEXT,
  content TEXT,
  action_buttons JSONB,
  priority INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_profile public.profiles;
  user_stats RECORD;
BEGIN
  -- Ottieni profilo utente
  SELECT * INTO user_profile FROM public.profiles WHERE user_id = _user_id;
  
  -- Calcola statistiche utente
  SELECT 
    EXTRACT(days FROM (now() - user_profile.created_at)) as days_active,
    (SELECT COUNT(*) FROM public.posts WHERE user_id = _user_id) as posts_count,
    (SELECT COUNT(*) FROM public.bookings WHERE client_id = _user_id) as booking_count,
    (SELECT COUNT(*) FROM public.live_streams WHERE professional_id = (SELECT id FROM public.professionals WHERE user_id = _user_id)) as live_streams_count,
    (SELECT COUNT(*) FROM public.notifications WHERE user_id = _user_id AND read = false) as notifications_unread,
    user_profile.qr_coins as qr_coins,
    CASE WHEN EXISTS(SELECT 1 FROM public.user_subscriptions WHERE user_id = _user_id AND status = 'active') THEN true ELSE false END as subscription_active
  INTO user_stats;
  
  -- Restituisci suggerimenti basati sulle condizioni
  RETURN QUERY
  SELECT 
    gen_random_uuid() as suggestion_id,
    'suggestion'::TEXT as message_type,
    config.suggestion_template as content,
    CASE 
      WHEN config.suggestion_template ILIKE '%post%' THEN '[{"text": "Crea Post", "action": "navigate", "target": "/create-post"}]'::JSONB
      WHEN config.suggestion_template ILIKE '%live%' THEN '[{"text": "Vai Live", "action": "navigate", "target": "/go-live"}]'::JSONB
      WHEN config.suggestion_template ILIKE '%prenotare%' THEN '[{"text": "Cerca Professionisti", "action": "navigate", "target": "/stylists"}]'::JSONB
      WHEN config.suggestion_template ILIKE '%wallet%' THEN '[{"text": "Apri Wallet", "action": "navigate", "target": "/wallet"}]'::JSONB
      WHEN config.suggestion_template ILIKE '%notifiche%' THEN '[{"text": "Vedi Notifiche", "action": "navigate", "target": "/notifications"}]'::JSONB
      WHEN config.suggestion_template ILIKE '%profilo%' THEN '[{"text": "Completa Profilo", "action": "navigate", "target": "/edit-profile"}]'::JSONB
      WHEN config.suggestion_template ILIKE '%Premium%' THEN '[{"text": "Scopri Pro", "action": "navigate", "target": "/subscriptions"}]'::JSONB
      ELSE '[{"text": "Scopri", "action": "dismiss"}]'::JSONB
    END as action_buttons,
    config.priority
  FROM public.chatbot_suggestions_config config
  WHERE config.user_type = user_profile.user_type 
    AND config.active = true
    AND (
      -- Controlla condizioni dinamiche
      (config.trigger_conditions->>'posts_count' IS NULL OR 
       (config.trigger_conditions->>'posts_count')::int >= user_stats.posts_count) AND
      (config.trigger_conditions->>'booking_count' IS NULL OR 
       (config.trigger_conditions->>'booking_count')::int >= user_stats.booking_count) AND
      (config.trigger_conditions->>'days_active' IS NULL OR 
       (config.trigger_conditions->>'days_active')::int <= user_stats.days_active) AND
      (config.trigger_conditions->>'live_streams_count' IS NULL OR 
       (config.trigger_conditions->>'live_streams_count')::int >= user_stats.live_streams_count) AND
      (config.trigger_conditions->>'qr_coins' IS NULL OR 
       (config.trigger_conditions->>'qr_coins')::int >= user_stats.qr_coins) AND
      (config.trigger_conditions->>'subscription_active' IS NULL OR 
       (config.trigger_conditions->>'subscription_active')::bool = user_stats.subscription_active)
    )
    -- Non mostrare se già mostrato di recente
    AND NOT EXISTS (
      SELECT 1 FROM public.user_suggestion_history 
      WHERE user_id = _user_id 
        AND suggestion_type = config.suggestion_template
        AND last_shown_at > (now() - INTERVAL '1 hour' * config.max_frequency_hours)
    )
  ORDER BY config.priority DESC
  LIMIT 3;
END;
$$;
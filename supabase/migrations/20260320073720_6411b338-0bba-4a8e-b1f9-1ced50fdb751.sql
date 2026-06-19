
-- ============================================
-- STELLA VOICE COMMANDS
-- ============================================
CREATE TABLE public.stella_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  command_text TEXT NOT NULL,
  command_type TEXT CHECK (command_type IN (
    'navigate','search','message','like','comment','follow','book','info','schedule','call','payment'
  )),
  intent JSONB DEFAULT '{}',
  status TEXT CHECK (status IN (
    'pending','approved','executing','completed','failed','cancelled','requires_confirmation'
  )) DEFAULT 'pending',
  requires_confirmation BOOLEAN DEFAULT false,
  confirmed_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.stella_commands ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_stella_commands_user ON public.stella_commands(user_id);
CREATE INDEX idx_stella_commands_status ON public.stella_commands(status);

CREATE POLICY "Users manage own stella commands" ON public.stella_commands FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================
-- STELLA SCHEDULED ACTIONS
-- ============================================
CREATE TABLE public.stella_scheduled_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  action_params JSONB DEFAULT '{}',
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT CHECK (status IN ('pending','executed','cancelled','failed')) DEFAULT 'pending',
  executed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.stella_scheduled_actions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_scheduled_actions_user ON public.stella_scheduled_actions(user_id);
CREATE INDEX idx_scheduled_actions_time ON public.stella_scheduled_actions(scheduled_for) WHERE status = 'pending';

CREATE POLICY "Users manage own scheduled actions" ON public.stella_scheduled_actions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================
-- STELLA USER SETTINGS
-- ============================================
CREATE TABLE public.stella_user_settings (
  user_id UUID PRIMARY KEY,
  voice_enabled BOOLEAN DEFAULT true,
  auto_actions_enabled BOOLEAN DEFAULT false,
  scheduling_enabled BOOLEAN DEFAULT false,
  can_send_messages BOOLEAN DEFAULT false,
  can_like_comment BOOLEAN DEFAULT true,
  can_follow BOOLEAN DEFAULT true,
  can_book BOOLEAN DEFAULT true,
  can_spend_coins BOOLEAN DEFAULT false,
  max_likes_per_hour INTEGER DEFAULT 20,
  max_comments_per_hour INTEGER DEFAULT 10,
  max_messages_per_hour INTEGER DEFAULT 20,
  require_confirmation_for TEXT[] DEFAULT ARRAY['booking','payment','follow','message'],
  total_commands_issued INTEGER DEFAULT 0,
  total_actions_executed INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.stella_user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own stella settings" ON public.stella_user_settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================
-- STELLA ACTION LOG (Rate Limiting)
-- ============================================
CREATE TABLE public.stella_action_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  target_id UUID,
  target_type TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.stella_action_log ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_action_log_user_time ON public.stella_action_log(user_id, created_at);
CREATE INDEX idx_action_log_type ON public.stella_action_log(action_type);

CREATE POLICY "Users view own action log" ON public.stella_action_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own action log" ON public.stella_action_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FUNCTION: Check rate limit for Stella actions
-- ============================================
CREATE OR REPLACE FUNCTION public.stella_check_rate_limit(_user_id UUID, _action_type TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  settings stella_user_settings;
  action_count INTEGER;
  max_allowed INTEGER;
BEGIN
  SELECT * INTO settings FROM stella_user_settings WHERE user_id = _user_id;
  
  IF NOT FOUND THEN
    INSERT INTO stella_user_settings (user_id) VALUES (_user_id);
    SELECT * INTO settings FROM stella_user_settings WHERE user_id = _user_id;
  END IF;

  SELECT COUNT(*) INTO action_count
  FROM stella_action_log
  WHERE user_id = _user_id
    AND action_type = _action_type
    AND created_at > NOW() - INTERVAL '1 hour';

  max_allowed := CASE _action_type
    WHEN 'like' THEN settings.max_likes_per_hour
    WHEN 'comment' THEN settings.max_comments_per_hour
    WHEN 'message' THEN settings.max_messages_per_hour
    ELSE 30
  END;

  RETURN jsonb_build_object(
    'allowed', action_count < max_allowed,
    'current_count', action_count,
    'max_allowed', max_allowed,
    'remaining', GREATEST(max_allowed - action_count, 0)
  );
END;
$$;


-- Update ai_module_configs with extended fields and new ai_assistant module
ALTER TABLE public.ai_module_configs 
  ADD COLUMN IF NOT EXISTS push_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS automation_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_smart boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS geolocation boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS personalization boolean NOT NULL DEFAULT true;

-- Update existing modules with extended config
UPDATE public.ai_module_configs SET 
  push_enabled = true, automation_enabled = true, priority = 8,
  triggers = triggers || '[{"trigger": "offer_reminder", "message": "Hai {n_pending} candidature aperte. Vuoi completare oggi?", "cta": ["Completa candidatura", "Visualizza tutte"]}]'::jsonb,
  ai_settings = ai_settings || '{"push_frequency": "smart", "analytics_tracking": true}'::jsonb
WHERE module_key = 'job_offers';

UPDATE public.ai_module_configs SET 
  push_enabled = true, automation_enabled = true, ai_smart = true, priority = 10
WHERE module_key = 'chat_live';

UPDATE public.ai_module_configs SET 
  push_enabled = true, automation_enabled = true, ai_smart = true, geolocation = true
WHERE module_key = 'smart_map';

UPDATE public.ai_module_configs SET 
  push_enabled = true, automation_enabled = true, priority = 9,
  triggers = triggers || '[{"trigger": "payment_reminder", "message": "Hai un pagamento in sospeso per {service_name}. Vuoi completarlo ora?", "cta": ["Paga ora", "Salva"]}, {"trigger": "klarna_available", "message": "Puoi pagare in 3 rate con Klarna! Vuoi attivare?", "cta": ["Paga in 3 rate", "Paga tutto"]}]'::jsonb
WHERE module_key = 'payments_wallet';

UPDATE public.ai_module_configs SET automation_enabled = true WHERE module_key = 'content_sharing';
UPDATE public.ai_module_configs SET push_enabled = true, automation_enabled = true WHERE module_key = 'premium_subscription';
UPDATE public.ai_module_configs SET push_enabled = true, automation_enabled = true WHERE module_key = 'shop_services';

-- Add new ai_assistant module
INSERT INTO public.ai_module_configs (module_key, module_name, description, roles, triggers, ai_settings, priority, push_enabled, automation_enabled, ai_smart, personalization)
VALUES (
  'ai_assistant',
  'Assistente AI Proattivo',
  'Bot AI guida utente, suggerisce azioni, promuove live e funzioni con onboarding e tips giornalieri',
  ARRAY['client', 'professional', 'business'],
  '[
    {"trigger": "onboarding", "message": "Ciao {name}, sono Stella! Ti mostro come usare Style e trovare offerte, servizi e live. 🌟", "cta": ["Mostrami", "Salta tour", "Ricevi suggerimenti"]},
    {"trigger": "usage_tip", "message": "Hai provato {module_name} oggi? Ti consiglio {action_suggested}!", "cta": ["Prova ora", "Salva per dopo"]},
    {"trigger": "daily_digest", "message": "Buongiorno {name}! Oggi: {n_lives} live, {n_offers} offerte e {n_promos} promo vicino a te.", "cta": ["Vedi tutto", "Solo live", "Solo offerte"]},
    {"trigger": "engagement_boost", "message": "Il tuo profilo ha ricevuto {n_views} visite! Pubblica un post per aumentare la visibilità.", "cta": ["Crea Post", "Vai Live", "Boost Profilo"]},
    {"trigger": "inactive_nudge", "message": "Ci manchi! 💜 Torna su Style: ci sono novità per te.", "cta": ["Scopri novità", "Apri app"]}
  ]'::jsonb,
  '{"personalization": true, "message_variations": 5, "push_frequency": "smart", "analytics_tracking": true, "nudge_after_inactive_hours": 48}'::jsonb,
  10,
  true, true, true, true
) ON CONFLICT (module_key) DO UPDATE SET
  triggers = EXCLUDED.triggers,
  ai_settings = EXCLUDED.ai_settings,
  push_enabled = EXCLUDED.push_enabled,
  automation_enabled = EXCLUDED.automation_enabled,
  ai_smart = EXCLUDED.ai_smart,
  personalization = EXCLUDED.personalization;

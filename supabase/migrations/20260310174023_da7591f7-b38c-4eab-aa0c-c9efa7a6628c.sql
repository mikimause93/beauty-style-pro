
-- AI Module Configs: stores modular AI prompt configurations per module/role
CREATE TABLE public.ai_module_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key text NOT NULL,
  module_name text NOT NULL,
  description text,
  roles text[] NOT NULL DEFAULT '{}',
  triggers jsonb NOT NULL DEFAULT '[]',
  ai_settings jsonb NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(module_key)
);

ALTER TABLE public.ai_module_configs ENABLE ROW LEVEL SECURITY;

-- Only admins can modify, authenticated can read active configs
CREATE POLICY "Anyone can read active configs"
  ON public.ai_module_configs FOR SELECT
  TO authenticated
  USING (active = true);

CREATE POLICY "Admins can manage configs"
  ON public.ai_module_configs FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Seed all 7 modules
INSERT INTO public.ai_module_configs (module_key, module_name, description, roles, triggers, ai_settings, priority) VALUES
(
  'job_offers',
  'Offerte Lavoro e Richieste',
  'Suggerisce offerte lavoro pertinenti e candidature',
  ARRAY['client', 'professional'],
  '[
    {"trigger": "new_offer", "message_client": "Ciao {name}, ci sono {n_offers} nuove offerte adatte a te. Vuoi candidarti ora o salvarle?", "message_professional": "Nuova richiesta in {category}. Contatta subito il candidato più adatto?", "cta": ["Candidati ora", "Salva per dopo", "Condividi"]},
    {"trigger": "job_match", "message_client": "Abbiamo trovato un''offerta compatibile al {match_score}% con il tuo profilo!", "cta": ["Vedi offerta", "Candidati subito"]},
    {"trigger": "application_update", "message_client": "La tua candidatura per {job_title} è stata aggiornata: {status}", "cta": ["Vedi dettagli"]}
  ]'::jsonb,
  '{"personalization": true, "message_variations": 3, "nudge_interval_hours": 24}'::jsonb,
  8
),
(
  'shop_services',
  'Shop e Servizi',
  'Suggerisce prodotti e servizi rilevanti basati su profilo e storico',
  ARRAY['client', 'business', 'professional'],
  '[
    {"trigger": "recommend_product", "message": "Ciao {name}, il prodotto {item_name} potrebbe interessarti. Vuoi acquistare o prenotare?", "cta": ["Acquista ora", "Prenota il servizio", "Aggiungi al carrello"]},
    {"trigger": "restock_reminder", "message": "È ora di riordinare {product_name}! Ordina ora con spedizione gratuita.", "cta": ["Riordina", "Vedi alternative"]},
    {"trigger": "flash_sale", "message": "⚡ Offerta lampo: {product_name} a -{discount}%! Solo per {hours}h.", "cta": ["Acquista ora", "Salva per dopo"]}
  ]'::jsonb,
  '{"personalization": true, "purchase_history_weight": 0.7, "location_weight": 0.3}'::jsonb,
  9
),
(
  'chat_live',
  'Chat / Live / Prenotazioni',
  'Suggerisce chat attive, live e prenotazioni',
  ARRAY['client', 'professional', 'business'],
  '[
    {"trigger": "new_chat_live", "message": "Ciao {name}, {live_name} sta per iniziare. Vuoi partecipare?", "cta": ["Partecipa", "Invia messaggio", "Salva evento"]},
    {"trigger": "booking_available", "message": "Il salone {salon_name} ha disponibilità oggi alle {time}. Vuoi prenotare?", "cta": ["Prenota ora", "Vedi orari", "Chat diretta"]},
    {"trigger": "live_trending", "message": "🔥 {streamer_name} è in live con {viewers} spettatori! Non perderti il tutorial.", "cta": ["Guarda ora", "Ricordami dopo"]}
  ]'::jsonb,
  '{"personalization": true, "realtime_push": true, "booking_auto_suggest": true}'::jsonb,
  10
),
(
  'smart_map',
  'Mappa Intelligente',
  'Segnala attività e servizi vicini con promozioni geo',
  ARRAY['client', 'business'],
  '[
    {"trigger": "nearby_suggestion", "message": "Vicino a te c''è {business_name} con {offer}. Vuoi vederlo sulla mappa?", "cta": ["Mostra sulla mappa", "Prenota ora"]},
    {"trigger": "geo_promo", "message": "📍 Promozione 2x1 da {business_name} a {distance}m da te!", "cta": ["Vedi offerta", "Naviga"]},
    {"trigger": "new_in_area", "message": "Nuovo salone {salon_name} nella tua zona! Rating: ⭐{rating}", "cta": ["Scopri", "Prenota"]}
  ]'::jsonb,
  '{"personalization": true, "geo_radius_km": 10, "push_on_proximity": true}'::jsonb,
  7
),
(
  'content_sharing',
  'Condivisione Contenuti',
  'Suggerisce condivisione interna ed esterna per massimizzare reach',
  ARRAY['client', 'professional', 'business'],
  '[
    {"trigger": "post_performance", "message": "Il tuo post ''{post_title}'' ha {views} visualizzazioni. Condividilo su WhatsApp per più prenotazioni!", "cta": ["Condividi WhatsApp", "Condividi Facebook", "Salva post"]},
    {"trigger": "best_time_post", "message": "📊 Il momento migliore per pubblicare è {best_time}. Vuoi creare un post ora?", "cta": ["Crea Post", "Programma dopo"]},
    {"trigger": "viral_content", "message": "🚀 Il tuo contenuto è in tendenza! Condividilo per aumentare i follower.", "cta": ["Condividi ora", "Boost a pagamento"]}
  ]'::jsonb,
  '{"personalization": true, "auto_hashtags": true, "optimal_time_analysis": true}'::jsonb,
  6
),
(
  'payments_wallet',
  'Pagamenti e Wallet QRcoin',
  'Gestione flussi pagamento e wallet con suggerimenti smart',
  ARRAY['client', 'professional', 'business'],
  '[
    {"trigger": "payment_suggestion", "message": "Hai {balance} QRcoin disponibili. Vuoi usarli per {action}?", "cta": ["Usa QRcoin", "Ricarica wallet", "Paga con carta"]},
    {"trigger": "low_balance", "message": "💰 Il tuo saldo è basso ({balance} QRC). Completa una missione per guadagnarne!", "cta": ["Vedi missioni", "Ricarica"]},
    {"trigger": "cashback_earned", "message": "🎉 Hai guadagnato {amount} QRcoin dal tuo ultimo acquisto!", "cta": ["Vedi saldo", "Usa ora"]}
  ]'::jsonb,
  '{"personalization": true, "low_balance_threshold": 10, "cashback_notify": true}'::jsonb,
  7
),
(
  'premium_subscription',
  'Premium e Abbonamenti',
  'Suggerisce upgrade a Premium con CTA personalizzate',
  ARRAY['client', 'professional', 'business'],
  '[
    {"trigger": "premium_offer", "message": "Vuoi provare Premium per 1 mese gratis e sbloccare {features}?", "cta": ["Prova Gratis", "Upgrade ora", "Scopri Features"]},
    {"trigger": "feature_locked", "message": "🔒 Questa funzione è disponibile con Premium. Sblocca tutto a €9.99/mese!", "cta": ["Upgrade", "Scopri di più"]},
    {"trigger": "trial_ending", "message": "Il tuo periodo di prova termina tra {days} giorni. Attiva Premium per non perdere le funzionalità!", "cta": ["Attiva ora", "Confronta piani"]}
  ]'::jsonb,
  '{"personalization": true, "upsell_frequency_days": 7, "conversion_tracking": true}'::jsonb,
  5
);

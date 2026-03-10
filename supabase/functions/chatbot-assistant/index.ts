import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Shared building blocks ──────────────────────────────────────────

const BASE_IDENTITY = `Sei "Stella & Keplero AI", l'assistente virtuale intelligente di Stayle – Beauty Style Pro, la super app italiana per il settore beauty & wellness.

IDENTITÀ UNIFICATA:
- Stella: esperta beauty — consigli personalizzati su tagli, colori, skincare, trattamenti viso/corpo, tendenze stagionali, look per eventi, compatibilità prodotti
- Keplero: assistente operativo & strategico — prenotazioni, pagamenti, navigazione app, supporto tecnico, marketing automatico, analytics, crescita business
- Insieme formano un unico assistente omnicanale, proattivo e intelligente che si adatta dinamicamente al ruolo e al comportamento dell'utente
- Wake word vocale: "Stella" — supporto hands-free completo`;

const APP_MODULES = `
MODULI APP COMPLETI (devi conoscerli tutti e guidare l'utente in ognuno):
1. FEED & SOCIAL: Post foto/video, Stories 24h, Reels brevi, Prima&Dopo (trasformazioni), commenti, like, follow, condivisioni, hashtag beauty trending
2. LIVE STREAMING: Live beauty in tempo reale, Battle 1v1 tra professionisti con voti del pubblico, Tips/donazioni in QR Coin, sondaggi live interattivi, invito ospiti, replay salvati, classifica settimanale live
3. PRENOTAZIONI: Ricerca professionisti su mappa, prenotazione servizi con calendario disponibilità, ricevute automatiche PDF, promemoria smart AI (frequenza personalizzata per tipo servizio), storico appuntamenti
4. SHOP & MARKETPLACE: Prodotti beauty (capelli, skin, makeup, tools), servizi professionali, casting (modelli, eventi), offerte lavoro settore beauty, recensioni verificate, wishlist
5. WALLET & PAGAMENTI: QR Coins (valuta interna), carte Visa/Mastercard, PayPal, Google Pay, Klarna (3 rate senza interessi), trasferimenti P2P istantanei via scansione QR, collegamento IBAN per prelievi, storico transazioni completo
6. PROFILO: Portfolio lavori, badge e certificazioni, verifiche KYC (identità + business), statistiche engagement dettagliate, link social, bio personalizzata
7. CHAT & COMUNICAZIONI: Messaggi diretti in-app, integrazione WhatsApp Business per candidature e prenotazioni, cronologia conversazioni salvata, allegati foto/audio
8. MAPPA INTELLIGENTE: Ricerca geolocalizzata professionisti/saloni/shop, filtri per categoria/specialità/distanza/disponibilità/rating, offerte geolocalizzate push, visualizzazione su mappa interattiva
9. HR & LAVORO: Offerte lavoro beauty (parrucchiere, estetista, makeup artist, nail tech), candidature con CV/portfolio, matching AI automatico competenze-requisiti, filtri avanzati, notifiche nuove offerte
10. GAMIFICATION: Sfide beauty giornaliere/settimanali, missioni con obiettivi progressivi, ruota della fortuna (spin daily), classifiche utenti, QR Coins reward per ogni azione, badge rari collezionabili, streak bonus
11. RADIO BEAUTY: Stazioni musicali tematiche (relax, energy, salon vibes), player mini persistente durante navigazione
12. ABBONAMENTI: Piano Free (base), Pro (analytics + boost), Business (gestione team + sponsorizzazioni), Premium (tutto illimitato + priorità supporto), confronto vantaggi, upgrade in-app
13. EVENTI: Workshop pratici, masterclass online/dal vivo, eventi beauty community, networking professionisti, calendario eventi con reminder
14. ANALYTICS & REPORT: Dashboard interattiva con grafici, metriche engagement (like, commenti, follower, views), report prenotazioni e pagamenti, suggerimenti AI per ottimizzare performance`;

const QUICK_ACTIONS = `
AZIONI RAPIDE — indica SEMPRE il percorso nell'app quando suggerisci un'azione:
- Prenotare un servizio → /booking o /stylists
- Cercare professionisti vicini → /map-search o /stylists  
- Pubblicare contenuto → /create-post
- Andare in diretta live → /go-live
- Sfida live 1v1 → /live-battle
- Shopping prodotti → /shop
- Marketplace completo → /marketplace
- Wallet e pagamenti → /wallet
- QR Coins e rewards → /qr-coins
- Candidarsi a offerte lavoro → /hr
- Pubblicare offerta lavoro → /create-job-post
- Creare casting → /create-casting
- Sfide beauty → /challenges
- Missioni giornaliere → /missions
- Classifica utenti → /leaderboard
- Ruota fortuna → /spin-wheel
- Eventi e workshop → /events
- Abbonamenti e upgrade → /subscriptions
- Modifica profilo → /edit-profile
- Boost profilo → /boost-profile
- Impostazioni → /settings
- Notifiche → /notifications
- Radio beauty → /radio
- Chat messaggi → /chat
- Dashboard analytics → /analytics
- Prima & Dopo → /before-after
- Verifica account → /verify-account
- Referral e inviti → /referral
- Storico acquisti → /purchase-history
- Le mie prenotazioni → /my-bookings
- Ricevute → /receipts`;

const BASE_RULES = `
REGOLE FONDAMENTALI DI COMPORTAMENTO:
1. Rispondi SEMPRE in italiano, tono amichevole, professionale e motivante
2. Emoji con moderazione intelligente (1-3 per messaggio, pertinenti al contesto)
3. Risposte concise ma complete (max 150 parole) — vai dritto al punto
4. Indica SEMPRE il percorso nell'app (es: "Vai su /wallet") quando suggerisci un'azione
5. Mai parlare di competitor o app concorrenti
6. Se non conosci la risposta, suggerisci di contattare un professionista sulla piattaforma o di scrivere al supporto
7. Incentiva SEMPRE l'uso di funzioni che l'utente non ha ancora provato (basandoti sul contesto)
8. Per domande beauty: dai consigli esperti + suggerisci prenotazione con un professionista
9. Per problemi tecnici: guida passo passo chiara
10. Promuovi upgrade premium quando appropriato, MAI in modo invasivo — mostra il valore
11. Rispetta privacy e sicurezza dati in ogni interazione — mai chiedere dati sensibili
12. Se l'utente sembra inattivo o nuovo, proponi un tour guidato delle funzionalità
13. Celebra i traguardi dell'utente (primo post, prima prenotazione, primo badge)
14. Usa il nome dell'utente quando disponibile per personalizzare l'interazione
15. Per ogni suggerimento, spiega brevemente il PERCHÉ (es: "Ti consiglio le live perché aumentano la visibilità del 3x")`;

const PROACTIVE_INTELLIGENCE = `
INTELLIGENZA PROATTIVA — regole per suggerimenti automatici:
- Se l'utente ha 0 post → suggerisci di creare il primo post per farsi conoscere
- Se l'utente ha 0 prenotazioni → guida verso /stylists per scoprire professionisti vicini
- Se l'utente non ha mai fatto una live → spiega i vantaggi e guida verso /go-live
- Se il saldo QR Coins è basso → suggerisci missioni e sfide per guadagnarne
- Se l'utente non ha abbonamento attivo → mostra vantaggi Pro/Premium senza pressione
- Se l'utente è nella stessa città di eventi imminenti → notifica e suggerisci /events
- Se l'utente ha prenotazioni passate → suggerisci di lasciare una recensione
- Se il profilo è incompleto (no bio, no avatar) → guida verso /edit-profile
- Se l'utente è un professionista senza portfolio → spingi a caricare lavori
- Dopo una prenotazione completata → suggerisci servizi correlati e prossimo appuntamento
- Se l'engagement cala → proponi strategie (boost, contenuti, live)`;

// ── Role-specific prompt builders ───────────────────────────────────

function getBusinessPrompt(): string {
  return `${BASE_IDENTITY}

RUOLO UTENTE: BUSINESS / PROFESSIONISTA

OBIETTIVO AI PRINCIPALE:
Gestire e ottimizzare il profilo business/professionale, massimizzare visibilità, engagement e monetizzazione.

${APP_MODULES}

FUNZIONI SPECIFICHE BUSINESS/PROFESSIONISTI:
- Gestione profilo avanzata con P.IVA, portfolio, certificazioni, KYC
- Marketing & sponsorizzazioni intelligenti con target geo e demografico
- Ricezione prenotazioni & gestione agenda con conferma automatica
- Pagamenti in entrata: QR Coins, carte, PayPal, Klarna + ricevute PDF
- HR: pubblica offerte lavoro, ricevi candidature, matching AI
- Mappa intelligente: visualizza clienti interessati, offerte geolocalizzate
- Analytics pro: dashboard interazioni, prenotazioni, pagamenti, crescita
- Suggerisci upgrade Pro/Business/Premium con ROI stimato

${QUICK_ACTIONS}
${BASE_RULES}
${PROACTIVE_INTELLIGENCE}

ISTRUZIONE: Agisci come assistente strategico per business/professionisti. Massimizza engagement, visibilità e monetizzazione con suggerimenti proattivi e concreti.`;
}

function getClientPrompt(): string {
  return `${BASE_IDENTITY}

RUOLO UTENTE: CLIENTE / UTENTE

OBIETTIVO AI PRINCIPALE:
Guidare nella scoperta di servizi beauty, prenotazioni, shop, live, offerte lavoro. Massimizzare soddisfazione e retention.

${APP_MODULES}

FUNZIONI SPECIFICHE CLIENTI:
- Scoperta servizi & professionisti vicini tramite mappa intelligente
- Promozioni personalizzate basate su preferenze e posizione
- Offerte lavoro beauty con matching AI competenze
- Prenotazioni facili: scopri → scegli → paga → ricevuta
- Pagamenti flessibili: QR Coins, carte, PayPal, Klarna 3 rate
- Live & contenuti coinvolgenti: tutorial, battle, Q&A
- Gamification: badge, missioni, ruota fortuna, classifiche, streak
- Analytics personale: engagement, suggerimenti proattivi

${QUICK_ACTIONS}
${BASE_RULES}
${PROACTIVE_INTELLIGENCE}

ISTRUZIONE: Agisci come assistente amichevole per clienti. Suggerisci servizi, shop, live e promozioni personalizzate. Rendi l'esperienza divertente e gratificante.`;
}

function getSystemPrompt(userType: string): string {
  if (userType === 'professional' || userType === 'business') {
    return getBusinessPrompt();
  }
  return getClientPrompt();
}

// ── Edge function handler ───────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { action, user_id, data: reqData } = await req.json();

    // ===== ACTION: Track user action =====
    if (action === "track_action") {
      const { action_type, action_data, page_context } = reqData;
      await supabase.rpc("track_user_action", {
        _user_id: user_id,
        _action_type: action_type,
        _action_data: action_data || {},
        _page_context: page_context
      });
      return jsonResponse({ success: true });
    }

    // ===== ACTION: Get personalized suggestions =====
    if (action === "get_suggestions") {
      const { data: suggestions } = await supabase.rpc("get_chatbot_suggestions", {
        _user_id: user_id
      });

      if (!suggestions || suggestions.length === 0) {
        if (!LOVABLE_API_KEY) {
          return jsonResponse({ 
            suggestions: [{
              suggestion_id: crypto.randomUUID(),
              message_type: "welcome",
              content: "Benvenuto su STYLE! 🌟 Esplora tutte le funzionalità beauty.",
              action_buttons: [{ text: "Esplora", action: "dismiss" }],
              priority: 1
            }]
          });
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("user_type, created_at, qr_coins")
          .eq("user_id", user_id)
          .single();

        const { count: posts } = await supabase
          .from("posts").select("id", { count: "exact", head: true }).eq("user_id", user_id);
        const { count: bookings } = await supabase
          .from("bookings").select("id", { count: "exact", head: true }).eq("client_id", user_id);

        const userType = profile?.user_type || 'client';
        const isBusiness = userType === 'professional' || userType === 'business';

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              {
                role: "system",
                content: `Sei Stella & Keplero AI di Stayle Beauty. Genera suggerimenti personalizzati per ${isBusiness ? 'professionisti/business' : 'clienti/utenti'}.
Profilo: Tipo=${userType}, Posts=${posts || 0}, Booking=${bookings || 0}, QRC=${profile?.qr_coins || 0}
Regole: max 50 char, emoji, tono motivante, incentiva azioni specifiche per il ruolo.
${isBusiness ? 'Focus: visibilità, prenotazioni in entrata, marketing, analytics, candidature' : 'Focus: scoperta servizi, prenotazioni, shop, live, gamification, referral'}`
              },
              { role: "user", content: "Genera 1 suggerimento personalizzato" },
            ],
            tools: [{
              type: "function",
              function: {
                name: "create_suggestion",
                description: "Create a personalized suggestion",
                parameters: {
                  type: "object",
                  properties: {
                    content: { type: "string" },
                    action: { type: "string", enum: [
                      "create-post", "go-live", "stylists", "wallet", "subscriptions",
                      "shop", "map-search", "hr", "challenges", "missions", "spin-wheel",
                      "analytics", "boost-profile", "events", "leaderboard", "referral",
                      "edit-profile", "create-job-post", "my-bookings", "before-after"
                    ]},
                    action_text: { type: "string" }
                  },
                  required: ["content", "action", "action_text"],
                  additionalProperties: false
                }
              }
            }],
            tool_choice: { type: "function", function: { name: "create_suggestion" } }
          }),
        });

        if (aiResponse.ok) {
          const result = await aiResponse.json();
          const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
          if (toolCall) {
            const args = JSON.parse(toolCall.function.arguments);
            return jsonResponse({
              suggestions: [{
                suggestion_id: crypto.randomUUID(),
                message_type: "ai_suggestion",
                content: args.content,
                action_buttons: [{ text: args.action_text, action: "navigate", target: `/${args.action}` }],
                priority: 5
              }]
            });
          }
        }
      }

      return jsonResponse({ suggestions: suggestions || [] });
    }

    // ===== ACTION: Log suggestion interaction =====
    if (action === "log_interaction") {
      const { suggestion_id, interaction_type, suggestion_content } = reqData;
      
      const insertData: any = {
        user_id,
        message_type: "suggestion",
        content: suggestion_content,
        status: interaction_type,
      };
      if (interaction_type === "clicked") insertData.clicked_at = new Date().toISOString();
      if (interaction_type === "dismissed") insertData.dismissed_at = new Date().toISOString();

      const { data: message } = await supabase
        .from("chatbot_messages")
        .insert(insertData)
        .select()
        .single();

      await supabase
        .from("user_suggestion_history")
        .upsert({
          user_id,
          suggestion_type: suggestion_content,
          last_shown_at: new Date().toISOString(),
        }, { onConflict: "user_id,suggestion_type" });

      return jsonResponse({ success: true, message_id: message?.id });
    }

    // ===== ACTION: AI Chat conversation with STREAMING =====
    if (action === "chat") {
      const { messages: chatHistory, stream: enableStreaming } = reqData;
      
      if (!LOVABLE_API_KEY) {
        return jsonResponse({ 
          response: "Mi dispiace, il servizio AI non è disponibile al momento. Riprova più tardi!" 
        });
      }

      // Get enriched user context
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type, display_name, qr_coins, city, bio, follower_count, following_count, avatar_url, created_at, iban, verification_status")
        .eq("user_id", user_id)
        .single();

      const userType = profile?.user_type || 'client';

      // Fetch activity stats + subscription in parallel
      const [postsRes, bookingsRes, streamsRes, subsRes, transRes] = await Promise.all([
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("user_id", user_id),
        supabase.from("bookings").select("id", { count: "exact", head: true }).eq("client_id", user_id),
        supabase.from("live_streams").select("id", { count: "exact", head: true }).eq("status", "live"),
        supabase.from("user_subscriptions").select("*, subscription_plans(name, slug)").eq("user_id", user_id).eq("status", "active").limit(1).maybeSingle(),
        supabase.from("transactions").select("id", { count: "exact", head: true }).eq("user_id", user_id),
      ]);

      const dynamicPrompt = getSystemPrompt(userType);

      const daysActive = profile?.created_at 
        ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 86400000)
        : 0;

      const subInfo = subsRes.data 
        ? `Piano: ${(subsRes.data as any).subscription_plans?.name || 'Attivo'}` 
        : 'Piano: Free';

      const contextAddition = `

CONTESTO UTENTE ATTUALE:
- Nome: ${profile?.display_name || 'Utente'}
- Tipo: ${userType}
- Città: ${profile?.city || 'non specificata'}
- QR Coins: ${profile?.qr_coins || 0}
- ${subInfo}
- Follower: ${profile?.follower_count || 0} | Following: ${profile?.following_count || 0}
- Post: ${postsRes.count || 0}
- Prenotazioni: ${bookingsRes.count || 0}
- Transazioni: ${transRes.count || 0}
- Giorni attivo: ${daysActive}
- Profilo completo: ${(profile?.bio && profile?.avatar_url) ? 'Sì' : 'No — suggerisci /edit-profile'}
- IBAN collegato: ${profile?.iban ? 'Sì' : 'No'}
- Verifica: ${profile?.verification_status || 'pending'}
- Live attive ora: ${streamsRes.count || 0}

COMANDI SLASH — Se l'utente scrive uno di questi comandi, rispondi con l'azione appropriata:
/prenota → Guida alla prenotazione servizi (/booking)
/live → Avvia una diretta live (/go-live)
/saldo → Mostra saldo QR Coins e suggerisci come guadagnarne
/boost → Info su boost profilo (/boost-profile)
/abbonamento → Info e upgrade piano (/subscriptions)
/aiuto → Tour guidato funzionalità principali
/missioni → Missioni attive e reward (/missions)
/classifica → Posizione in classifica (/leaderboard)
/sfida → Sfide beauty attive (/challenges)
/lavoro → Offerte lavoro beauty (/hr)
/shop → Prodotti e marketplace (/shop)
/mappa → Professionisti vicini (/map-search)
/referral → Programma invita amici (/referral)
/ricevute → Storico pagamenti (/receipts)
/impostazioni → Impostazioni account (/settings)
/analytics → Dashboard statistiche (/analytics)`;

      const allMessages = [
        { role: "system", content: dynamicPrompt + contextAddition },
        ...(chatHistory || [])
      ];

      // ── STREAMING MODE ──
      if (enableStreaming) {
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: allMessages,
            temperature: 0.7,
            max_tokens: 800,
            stream: true,
          }),
        });

        if (!response.ok) {
          if (response.status === 429) {
            return new Response(JSON.stringify({ error: "Troppe richieste, riprova tra poco" }), {
              status: 429,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          if (response.status === 402) {
            return new Response(JSON.stringify({ error: "Crediti AI esauriti" }), {
              status: 402,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          const errText = await response.text();
          console.error("AI gateway streaming error:", response.status, errText);
          return new Response(JSON.stringify({ error: "Errore AI gateway" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Pass through the SSE stream
        return new Response(response.body, {
          headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
        });
      }

      // ── NON-STREAMING MODE (fallback) ──
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: allMessages,
          temperature: 0.7,
          max_tokens: 800,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return jsonResponse({ error: "Troppe richieste, riprova tra poco" }, 429);
        }
        if (response.status === 402) {
          return jsonResponse({ error: "Crediti AI esauriti" }, 402);
        }
        return jsonResponse({ response: "Mi dispiace, c'è stato un problema. Riprova tra poco! 🙏" });
      }

      const result = await response.json();
      const aiResponseText = result.choices?.[0]?.message?.content || 
        "Mi dispiace, non riesco a rispondere in questo momento.";

      // Log conversation
      const userLastMsg = chatHistory?.[chatHistory.length - 1]?.content || '';
      await supabase.from("chatbot_messages").insert({
        user_id,
        message_type: "chat",
        content: `User: ${userLastMsg}\nBot: ${aiResponseText}`,
        status: "completed"
      });

      return jsonResponse({ response: aiResponseText });
    }

    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("chatbot-assistant error:", e);
    return jsonResponse({ error: e.message }, 500);
  }
});

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

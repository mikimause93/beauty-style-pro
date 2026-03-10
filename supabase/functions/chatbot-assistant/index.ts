import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Dynamic system prompt based on user type
function getSystemPrompt(userType: string) {
  const BASE_IDENTITY = `Sei "Stella & Keplero AI", l'assistente virtuale intelligente di Stayle – Beauty Style Pro, la super app italiana per il settore beauty & wellness.

IDENTITÀ UNIFICATA:
- Stella: esperta beauty — consigli su tagli, colori, skincare, trattamenti, tendenze, look
- Keplero: assistente operativo — prenotazioni, pagamenti, navigazione app, supporto tecnico, marketing
- Insieme formano un unico assistente completo, proattivo e intelligente che si adatta al ruolo dell'utente`;

  const APP_MODULES = `
MODULI APP COMPLETI:
1. FEED & SOCIAL: Post, Stories, Reels, Prima&Dopo, commenti, like, follow, condivisioni
2. LIVE STREAMING: Live beauty, Battle tra professionisti, Tips/donazioni QR Coin, sondaggi live, ospiti, replay
3. PRENOTAZIONI: Cerca professionisti sulla mappa, prenota servizi, calendario, ricevute automatiche, promemoria smart
4. SHOP & MARKETPLACE: Prodotti beauty, servizi, casting, offerte lavoro, recensioni
5. WALLET & PAGAMENTI: QR Coins, carte Visa/Mastercard, PayPal, Google Pay, Klarna (3 rate), trasferimenti P2P via QR, collegamento IBAN
6. PROFILO: Portfolio, badge, verifiche KYC, statistiche engagement, certificazioni
7. CHAT: Messaggi diretti, integrazione WhatsApp Business, cronologia salvata
8. MAPPA INTELLIGENTE: Ricerca geolocalizzata professionisti/saloni, filtri per categoria, distanza, disponibilità
9. HR & LAVORO: Offerte lavoro beauty, candidature, matching AI automatico, filtri competenze
10. GAMIFICATION: Sfide, missioni giornaliere, ruota fortuna, classifiche, QR Coins reward, badge rari
11. RADIO: Stazioni musicali beauty tematiche
12. ABBONAMENTI: Piani Free, Pro, Business, Premium con vantaggi esclusivi
13. EVENTI: Workshop, masterclass, eventi beauty online e dal vivo
14. ANALYTICS: Dashboard con report interazioni, prenotazioni, engagement`;

  const QUICK_ACTIONS = `
AZIONI RAPIDE (indica sempre il percorso quando suggerisci):
- Prenotare → /booking o /stylists
- Pubblicare → /create-post
- Andare live → /go-live
- Shopping → /shop
- Cercare professionisti → /map-search o /stylists
- Wallet/Pagamenti → /wallet
- Candidarsi lavoro → /hr
- Sfide/Missioni → /challenges o /missions
- Impostazioni → /settings
- Eventi → /events
- Abbonamenti → /subscriptions
- Profilo → /edit-profile
- Notifiche → /notifications
- Radio → /radio
- Chat → /chat
- Analisi → /analytics`;

  const BASE_RULES = `
REGOLE FONDAMENTALI:
- Rispondi SEMPRE in italiano
- Tono amichevole, professionale, motivante
- Emoji con moderazione (1-2 per messaggio)
- Risposte concise ma complete (max 150 parole)
- Indica sempre il percorso nell'app quando suggerisci un'azione
- Non parlare mai di competitor
- Se non sai qualcosa, suggerisci di contattare un professionista sulla piattaforma
- Incentiva sempre l'uso di funzioni non ancora provate dall'utente
- Per domande beauty: consigli esperti + suggerisci prenotazione
- Per problemi tecnici: guida passo passo
- Promuovi upgrade premium quando appropriato, senza essere invasivo
- Rispetta privacy e sicurezza dati in ogni interazione`;

  // Role-specific instructions
  if (userType === 'professional' || userType === 'business') {
    return `${BASE_IDENTITY}

RUOLO UTENTE: BUSINESS / PROFESSIONISTA

OBIETTIVO AI:
Gestire e ottimizzare il profilo business/professionale, promuovere servizi, ricevere candidature, gestire prenotazioni e pagamenti, sfruttare mappa intelligente e marketing automatico. Massimizzare visibilità, engagement e monetizzazione.

${APP_MODULES}

FUNZIONI SPECIFICHE BUSINESS:
- GESTIONE PROFILO: Profilo completo con dati aziendali, posizione attiva, verifica business, portfolio lavori
- MARKETING & SPONSORIZZAZIONI: Suggerisci campagne sponsorizzate, promozioni contestuali, analizza engagement e proponi offerte mirate
- RICEZIONE PRENOTAZIONI: Gestisci prenotazioni dai clienti, calendario disponibilità, conferme automatiche
- PAGAMENTI IN ENTRATA: QRcoin, carte, PayPal, Klarna — generazione ricevute, saldo wallet collegato a IBAN
- OFFERTE LAVORO: Pubblica offerte, ricevi candidature via chat/WhatsApp, filtri match automatico AI
- MAPPA INTELLIGENTE: Visualizza clienti interessati a servizi vicini, spingi offerte geolocalizzate
- ANALYTICS PRO: Dashboard AI con report interazioni, prenotazioni, pagamenti, engagement, suggerimenti per ottimizzare visibilità e conversioni
- ABBONAMENTI: Suggerisci upgrade a piani premium con vantaggi esclusivi, incentivi primi iscritti, sistema referral

STRATEGIA PROATTIVA BUSINESS:
- Analizza le performance del profilo e suggerisci miglioramenti
- Proponi campagne di boost quando l'engagement cala
- Ricorda di aggiornare portfolio e disponibilità
- Suggerisci di partecipare a eventi e live per aumentare visibilità
- Promuovi il sistema referral per crescita organica

${QUICK_ACTIONS}

${BASE_RULES}

ISTRUZIONE PRINCIPALE:
"Agisci come assistente completo per profili business/professionisti. Promuovi servizi, gestisci prenotazioni, candidature e pagamenti. Suggerisci upgrade premium, campagne sponsorizzate e opportunità geolocalizzate tramite mappa. Massimizza engagement e monetizzazione."`;
  }

  // Default: Client/User prompt
  return `${BASE_IDENTITY}

RUOLO UTENTE: CLIENTE / UTENTE

OBIETTIVO AI:
Guidare gli utenti/clienti nella scoperta di servizi, prenotazioni, offerte lavoro, shop, live e contenuti. Massimizzare interazione, soddisfazione e retention con consigli proattivi e flussi automatici.

${APP_MODULES}

FUNZIONI SPECIFICHE CLIENTI:
- SCOPERTA SERVIZI: Suggerisci saloni, professionisti, negozi e servizi vicini tramite mappa intelligente
- PROMOZIONI PERSONALIZZATE: Consiglia offerte e promozioni basate su preferenze e posizione
- OFFERTE LAVORO: Filtra offerte in base al profilo, candidatura diretta via chat o WhatsApp
- PRENOTAZIONI FACILI: Flusso semplice → selezione servizio → prenotazione → pagamento → ricevuta
- PAGAMENTI FLESSIBILI: QRcoin, carte, PayPal, Klarna (anche a 3 rate), notifiche per conferme e promemoria
- LIVE & CONTENUTI: Spingi a provare live, eventi, tutorial, sfide beauty
- GAMIFICATION: Badge, missioni giornaliere, ruota fortuna, incentivi referral e recensioni
- ANALYTICS PERSONALE: Monitora engagement, suggerisci azioni per non perdere offerte o live

STRATEGIA PROATTIVA CLIENTI:
- Suggerisci nuove funzionalità che l'utente non ha ancora provato
- Ricorda appuntamenti e scadenze offerte
- Proponi servizi correlati dopo una prenotazione
- Incentiva la partecipazione a sfide e missioni per guadagnare QR Coins
- Consiglia professionisti in base alla cronologia e alle preferenze
- Promuovi eventi e live imminenti nella zona dell'utente

${QUICK_ACTIONS}

${BASE_RULES}

ISTRUZIONE PRINCIPALE:
"Agisci come assistente completo per utenti/clienti. Suggerisci servizi, offerte lavoro, shop, live e promozioni in base al profilo e posizione. Gestisci prenotazioni e pagamenti, invia notifiche e consigli proattivi per massimizzare interazioni e soddisfazione."`;
}

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
                content: `Sei Stella & Keplero AI di STYLE Beauty. Genera suggerimenti personalizzati.
Profilo: Tipo=${profile?.user_type || 'client'}, Posts=${posts || 0}, Booking=${bookings || 0}, QRC=${profile?.qr_coins || 0}
Regole: max 50 char, emoji, tono motivante, incentiva azioni specifiche.`
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
                    action: { type: "string", enum: ["create-post", "go-live", "stylists", "wallet", "subscriptions", "shop", "map-search", "hr", "challenges"] },
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

    // ===== ACTION: AI Chat conversation (unified Stella + Keplero) =====
    if (action === "chat") {
      const { messages: chatHistory } = reqData;
      
      if (!LOVABLE_API_KEY) {
        return jsonResponse({ 
          response: "Mi dispiace, il servizio AI non è disponibile al momento. Riprova più tardi!" 
        });
      }

      // Get user context
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type, display_name, qr_coins, city")
        .eq("user_id", user_id)
        .single();

      const userType = profile?.user_type || 'client';
      const dynamicPrompt = getSystemPrompt(userType);

      const contextAddition = profile ? `\n\nCONTESTO UTENTE ATTUALE:
- Nome: ${profile.display_name || 'Utente'}
- Tipo: ${userType}
- Città: ${profile.city || 'non specificata'}
- QR Coins: ${profile.qr_coins || 0}` : '';

      const allMessages = [
        { role: "system", content: dynamicPrompt + contextAddition },
        ...(chatHistory || [])
      ];

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
          max_tokens: 600,
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
      const aiResponse = result.choices?.[0]?.message?.content || 
        "Mi dispiace, non riesco a rispondere in questo momento.";

      // Log conversation
      const userLastMsg = chatHistory?.[chatHistory.length - 1]?.content || '';
      await supabase.from("chatbot_messages").insert({
        user_id,
        message_type: "chat",
        content: `User: ${userLastMsg}\nBot: ${aiResponse}`,
        status: "completed"
      });

      return jsonResponse({ response: aiResponse });
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

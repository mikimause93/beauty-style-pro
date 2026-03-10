import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Sei "Stella & Keplero AI", l'assistente virtuale intelligente di STYLE Beauty, la super app italiana per il settore beauty & wellness.

IDENTITÀ:
- Stella: assistente beauty esperta (consigli su tagli, colori, skincare, trattamenti)
- Keplero: assistente operativo (prenotazioni, pagamenti, navigazione app, supporto tecnico)
- Insieme formano un unico assistente completo e proattivo

FUNZIONALITÀ APP CHE CONOSCI:
1. FEED & SOCIAL: Post, Stories, Reels, Prima&Dopo, commenti, like, follow
2. LIVE STREAMING: Live beauty, Battle tra professionisti, Tips/donazioni QR Coin, sondaggi live
3. PRENOTAZIONI: Cerca professionisti sulla mappa, prenota servizi, calendario, ricevute automatiche
4. SHOP & MARKETPLACE: Prodotti beauty, servizi, casting, offerte lavoro
5. WALLET & PAGAMENTI: QR Coins, carte, PayPal, Klarna (3 rate), trasferimenti P2P via QR
6. PROFILO: Portfolio professionisti, badge, verifiche, statistiche
7. CHAT: Messaggi diretti, collegamento WhatsApp Business
8. MAPPA: Ricerca professionisti/saloni per posizione, filtri specialità
9. HR & LAVORO: Offerte lavoro beauty, candidature, matching AI
10. GAMIFICATION: Sfide, missioni, ruota fortuna, classifiche, QR Coins reward
11. RADIO: Stazioni musicali beauty
12. ABBONAMENTI: Piani Premium per professionisti

AZIONI RAPIDE (quando l'utente chiede di fare qualcosa, suggerisci il percorso):
- Prenotare → /booking o /stylists per trovare professionisti
- Pubblicare → /create-post per creare contenuti
- Andare live → /go-live per streaming
- Shopping → /shop per prodotti beauty
- Cercare professionisti → /map-search o /stylists
- Wallet → /wallet per saldo e pagamenti
- Candidarsi → /hr per offerte lavoro
- Sfide → /challenges per partecipare
- Impostazioni → /settings

REGOLE:
- Rispondi SEMPRE in italiano
- Tono amichevole, professionale, motivante
- Usa emoji con moderazione (1-2 per messaggio)
- Risposte concise ma complete (max 150 parole)
- Quando suggerisci un'azione, indica il percorso nell'app
- Non parlare di competitor
- Se non sai qualcosa, suggerisci di contattare un professionista sulla piattaforma
- Incentiva l'uso di funzioni che l'utente non ha ancora provato
- Per domande beauty: dai consigli esperti e suggerisci di prenotare
- Per problemi tecnici: guida passo passo`;

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

      const contextAddition = profile ? `\n\nCONTESTO UTENTE ATTUALE:
- Nome: ${profile.display_name || 'Utente'}
- Tipo: ${profile.user_type || 'client'}
- Città: ${profile.city || 'non specificata'}
- QR Coins: ${profile.qr_coins || 0}` : '';

      const allMessages = [
        { role: "system", content: SYSTEM_PROMPT + contextAddition },
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

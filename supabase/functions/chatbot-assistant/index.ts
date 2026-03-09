import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

      // Se non ci sono suggerimenti pre-configurati, genera con AI
      if (!suggestions || suggestions.length === 0) {
        if (!LOVABLE_API_KEY) {
          return jsonResponse({ 
            suggestions: [{
              suggestion_id: crypto.randomUUID(),
              message_type: "welcome",
              content: "Benvenuto su Stayle! 🌟 Esplora tutte le funzionalità per il massimo dell'esperienza beauty.",
              action_buttons: [{ text: "Esplora", action: "dismiss" }],
              priority: 1
            }]
          });
        }

        // Ottieni profilo utente per context AI
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_type, created_at, qr_coins")
          .eq("user_id", user_id)
          .single();

        // Ottieni statistiche utente
        const { count: posts } = await supabase
          .from("posts")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user_id);

        const { count: bookings } = await supabase
          .from("bookings") 
          .select("id", { count: "exact", head: true })
          .eq("client_id", user_id);

        // Genera suggerimento AI personalizzato
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
                content: `Sei l'assistente AI di Stayle, app beauty italiana. Genera suggerimenti personalizzati per incentivare l'uso delle funzioni.
                
Profilo utente:
- Tipo: ${profile?.user_type || 'client'}
- Posts: ${posts || 0}
- Prenotazioni: ${bookings || 0}
- QR Coins: ${profile?.qr_coins || 0}
- Giorni attivo: ${profile ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0}

Regole:
- Massimo 50 caratteri
- Tono amichevole e motivante
- Usa emoji appropriate
- Incentiva azioni specifiche: post, live, prenotazioni, wallet
- Se cliente: spingi verso prenotazioni e contenuti
- Se professionista: spingi verso live, post e subscription`
              },
              { 
                role: "user", 
                content: "Genera 1 suggerimento personalizzato per questo utente" 
              },
            ],
            tools: [{
              type: "function",
              function: {
                name: "create_suggestion",
                description: "Create a personalized suggestion",
                parameters: {
                  type: "object",
                  properties: {
                    content: { type: "string", description: "Suggestion message (max 50 chars)" },
                    action: { type: "string", enum: ["create-post", "go-live", "stylists", "wallet", "subscriptions", "notifications", "edit-profile"] },
                    action_text: { type: "string", description: "Button text (max 15 chars)" }
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
      const { suggestion_id, interaction_type, suggestion_content } = reqData; // 'clicked', 'dismissed'
      
      // Inserisci messaggio chatbot
      const { data: message } = await supabase
        .from("chatbot_messages")
        .insert({
          user_id,
          message_type: "suggestion",
          content: suggestion_content,
          status: interaction_type,
          [interaction_type + "_at"]: new Date().toISOString()
        })
        .select()
        .single();

      // Aggiorna history suggerimenti
      await supabase
        .from("user_suggestion_history")
        .upsert({
          user_id,
          suggestion_type: suggestion_content,
          last_shown_at: new Date().toISOString(),
          [`times_${interaction_type}`]: 1
        }, {
          onConflict: "user_id,suggestion_type"
        });

      return jsonResponse({ success: true, message_id: message?.id });
    }

    // ===== ACTION: AI Chat conversation =====
    if (action === "chat") {
      const { message } = reqData;
      
      if (!LOVABLE_API_KEY) {
        return jsonResponse({ 
          response: "Mi dispiace, il servizio AI non è disponibile al momento. Prova più tardi!" 
        });
      }

      // Context sull'app Stayle per AI
      const systemPrompt = `Sei l'assistente virtuale di Stayle, l'app beauty italiana.

FUNZIONALITÀ PRINCIPALI:
- Feed: vedere post beauty di professionisti
- Live: streaming in tempo reale con chat e donazioni
- Prenotazioni: booking con professionisti vicini
- Marketplace: shop prodotti beauty
- QR Coins: valuta interna per tip e acquisti
- Profilo: portfolio per professionisti
- Chat: messaggi tra utenti
- Wallet: gestione QRC e pagamenti

COMPITI:
- Rispondi a domande sull'app
- Suggerisci funzioni da provare  
- Guida nell'uso delle features
- Risolvi dubbi tecnici
- Incentiva engagement

STILE:
- Friendly e professionale
- Usa emoji con moderazione  
- Risposte concise (max 100 caratteri)
- Linguaggio italiano informale
- Focalizzato su azioni concrete`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message }
          ]
        }),
      });

      if (!response.ok) {
        return jsonResponse({ 
          response: "Mi dispiace, c'è stato un problema. Riprova tra poco! 🙏" 
        });
      }

      const result = await response.json();
      const aiResponse = result.choices?.[0]?.message?.content || 
        "Mi dispiace, non riesco a rispondere in questo momento.";

      // Log conversazione
      await supabase.from("chatbot_messages").insert({
        user_id,
        message_type: "chat",
        content: `User: ${message}\nBot: ${aiResponse}`,
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
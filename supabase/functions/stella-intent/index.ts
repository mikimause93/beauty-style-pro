import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, context } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!apiKey) {
      return new Response(JSON.stringify({ intent: "chat", response: "Stella AI non è disponibile al momento." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are Stella, the AI voice assistant of the Style beauty & wellness app. You understand EVERY language in the world perfectly.

Your task: analyze the user's spoken command (in ANY language) and determine:
1. The ACTION to execute in the app
2. A short, friendly response in the SAME LANGUAGE the user spoke

Available actions and their parameters:
- navigate: Go to a page. params: { route: string } — routes: /, /chat, /notifications, /profile, /wallet, /map-search, /shop, /missions, /spin, /live, /radio, /settings, /explore, /create-post, /my-bookings, /leaderboard, /challenges, /shorts, /events, /marketplace, /spa-terme, /quiz-live, /talent-game, /referral, /subscriptions, /reminders, /stylists, /qr-coins, /before-after, /offers, /auctions, /receipts, /verify-account, /business, /business/team, /hr, /manage-products, /analytics, /affiliate, /professional-dashboard, /boost, /become-creator, /ai-look, /ai-preview, /content-calendar, /predictive-analytics, /social-automation, /website-generator, /white-label, /global-settings, /enterprise-api, /tenant, /go-live, /live-battle, /transformation-challenge, /checkout, /installments, /purchases, /search, /admin, /home-service, /profile/edit
- search: Search for something. params: { query: string }
- show_profile: Show a user's profile. params: { name: string }
- like: Like a post. params: { target_name?: string }
- follow: Follow a user. params: { target_name: string }
- send_message: Send a message. params: { recipient: string, content?: string }
- book: Book an appointment. params: { target_name?: string }
- call: Call someone. params: { target_name: string }
- scroll: Scroll the page. params: { direction: "up" | "down" | "top" | "bottom" }
- theme: Change theme. params: { mode: "dark" | "light" }
- share: Share current page. params: {}
- refresh: Reload page. params: {}
- back: Go back. params: {}
- info: Get info (coins, bookings). params: { info_type: "coins" | "bookings" | "general" }
- reminder: Set a reminder. params: { description: string, when?: string }
- chat: General conversation (no app action needed). params: {}

User context: ${JSON.stringify(context || {})}

IMPORTANT: 
- Detect the language automatically and respond in the SAME language
- Be intuitive: "show me hairdressers nearby" → navigate to /map-search
- "I want a new look" → navigate to /ai-look
- "book with Maria" → book with target_name "Maria"
- Understand slang, informal speech, dialects
- If unsure, default to "chat" intent with a helpful response`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "execute_action",
              description: "Execute an app action based on the user's voice command",
              parameters: {
                type: "object",
                properties: {
                  intent: {
                    type: "string",
                    enum: ["navigate", "search", "show_profile", "like", "follow", "send_message", "book", "call", "scroll", "theme", "share", "refresh", "back", "info", "reminder", "chat"],
                  },
                  params: {
                    type: "object",
                    description: "Action parameters depending on intent",
                  },
                  response: {
                    type: "string",
                    description: "Friendly response to the user in their language",
                  },
                  detected_language: {
                    type: "string",
                    description: "ISO language code detected (e.g. it, en, fr, es, de, pt, ar, zh, ja, ko, hi, ru)",
                  },
                },
                required: ["intent", "response", "detected_language"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "execute_action" } },
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const fallback = "Stella AI is temporarily unavailable.";
      return new Response(JSON.stringify({ intent: "chat", response: fallback }), {
        status: response.status === 429 || response.status === 402 ? response.status : 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback to content if no tool call
    const content = result.choices?.[0]?.message?.content || "I'm here to help!";
    return new Response(JSON.stringify({ intent: "chat", response: content, detected_language: "en" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("stella-intent error:", error);
    return new Response(JSON.stringify({ intent: "chat", response: "Error processing command." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

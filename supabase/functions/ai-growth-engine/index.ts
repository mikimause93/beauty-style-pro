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

    // ===== ACTION: Get personalized AI suggestions for a user =====
    if (action === "user_suggestions") {
      const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user_id).single();
      if (!profile) return jsonResponse({ suggestions: [] });

      // Fetch nearby professionals
      const { data: pros } = await supabase
        .from("professionals")
        .select("*, profiles:user_id(display_name, avatar_url, city)")
        .limit(10);

      // Fetch active boosts
      const { data: boosts } = await supabase
        .from("profile_boosts")
        .select("user_id")
        .eq("active", true)
        .gte("expires_at", new Date().toISOString());
      const boostedIds = new Set((boosts || []).map(b => b.user_id));

      // Fetch user's booking count
      const { count: bookingCount } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("client_id", user_id);

      // Fetch user's subscription
      const { data: sub } = await supabase
        .from("user_subscriptions")
        .select("*, subscription_plans(slug)")
        .eq("user_id", user_id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const userCity = profile.city;
      const userType = profile.user_type;
      const hasSub = !!sub;
      const planSlug = sub?.subscription_plans?.slug || "free";

      const suggestions: any[] = [];

      // --- Matching suggestions ---
      if (userType === "client") {
        const nearbyPros = (pros || []).filter((p: any) => {
          const proCity = p.profiles?.city || p.city;
          return proCity && userCity && proCity.toLowerCase() === userCity.toLowerCase();
        });

        if (nearbyPros.length > 0) {
          const top = nearbyPros.sort((a: any, b: any) => {
            const aBoost = boostedIds.has(a.user_id) ? 10 : 0;
            const bBoost = boostedIds.has(b.user_id) ? 10 : 0;
            return (b.rating + bBoost) - (a.rating + aBoost);
          }).slice(0, 3);

          suggestions.push({
            type: "matching",
            icon: "MapPin",
            title: `${nearbyPros.length} professionisti nella tua zona`,
            description: `I migliori: ${top.map((p: any) => p.profiles?.display_name || p.business_name).join(", ")}`,
            action: "navigate",
            target: "/stylists",
            priority: 90,
          });
        }

        if ((bookingCount || 0) === 0) {
          suggestions.push({
            type: "onboarding",
            icon: "Calendar",
            title: "Prenota il tuo primo appuntamento",
            description: "Scopri i migliori professionisti beauty vicino a te",
            action: "navigate",
            target: "/stylists",
            priority: 95,
          });
        }
      }

      // --- Creator/Pro growth suggestions ---
      if (userType === "professional") {
        const { count: postCount } = await supabase
          .from("posts")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user_id);

        if ((postCount || 0) < 3) {
          suggestions.push({
            type: "growth",
            icon: "Camera",
            title: "Pubblica contenuti per crescere",
            description: "I profili con 5+ post ricevono 3x più prenotazioni",
            action: "navigate",
            target: "/create-post",
            priority: 85,
          });
        }

        if (planSlug === "free") {
          suggestions.push({
            type: "upsell",
            icon: "Crown",
            title: "Passa a Pro per più visibilità",
            description: "Priorità in ricerca, analytics e upload illimitati",
            action: "navigate",
            target: "/subscriptions",
            priority: 70,
          });
        }

        // Suggest boost
        const { data: activeBoost } = await supabase
          .from("profile_boosts")
          .select("id")
          .eq("user_id", user_id)
          .eq("active", true)
          .gte("expires_at", new Date().toISOString())
          .limit(1)
          .maybeSingle();

        if (!activeBoost) {
          suggestions.push({
            type: "boost",
            icon: "Rocket",
            title: "Boost il tuo profilo oggi",
            description: "Alta domanda nella tua zona! Aumenta la visibilità",
            action: "navigate",
            target: "/boost",
            priority: 80,
          });
        }

        suggestions.push({
          type: "engagement",
          icon: "Video",
          title: "Vai live per aumentare i follower",
          description: "Le live generano 5x più engagement dei post",
          action: "navigate",
          target: "/go-live",
          priority: 60,
        });
      }

      // --- General suggestions ---
      if (!hasSub && userType !== "client") {
        suggestions.push({
          type: "upsell",
          icon: "Crown",
          title: "Sblocca funzionalità Premium",
          description: "Abbonati per accedere a tutte le funzionalità",
          action: "navigate",
          target: "/subscriptions",
          priority: 65,
        });
      }

      // Referral suggestion
      suggestions.push({
        type: "referral",
        icon: "Gift",
        title: "Invita amici, guadagna QR Coins",
        description: "Ogni invito vale 20 QRC per te e per il tuo amico",
        action: "navigate",
        target: "/referral",
        priority: 50,
      });

      // Sort by priority
      suggestions.sort((a, b) => b.priority - a.priority);

      return jsonResponse({ suggestions: suggestions.slice(0, 5) });
    }

    // ===== ACTION: Generate auto-message suggestions =====
    if (action === "message_suggestions") {
      const { recipientName, context } = reqData || {};

      if (!LOVABLE_API_KEY) {
        // Fallback static suggestions
        return jsonResponse({
          messages: [
            `Ciao${recipientName ? " " + recipientName : ""}, ti ho trovato su Stayle! Vorrei prenotare un servizio.`,
            `Ciao! Sei disponibile oggi per un appuntamento?`,
            `Mi piace molto il tuo profilo! Possiamo collaborare?`,
            `Ciao, quanto costa un ${context || "servizio"}?`,
          ],
        });
      }

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
              content: `Sei un assistente per l'app beauty Stayle. Genera 4 messaggi brevi e professionali in italiano che un utente potrebbe inviare. Contesto: l'utente vuole contattare ${recipientName || "un professionista"} per ${context || "prenotare un servizio"}. Rispondi solo con un JSON array di 4 stringhe.`,
            },
            { role: "user", content: "Genera 4 messaggi suggeriti" },
          ],
          tools: [{
            type: "function",
            function: {
              name: "return_messages",
              description: "Return suggested messages",
              parameters: {
                type: "object",
                properties: {
                  messages: { type: "array", items: { type: "string" } }
                },
                required: ["messages"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "return_messages" } },
        }),
      });

      if (!response.ok) {
        console.error("AI error:", response.status);
        return jsonResponse({
          messages: [
            `Ciao${recipientName ? " " + recipientName : ""}, ti ho trovato su Stayle!`,
            `Sei disponibile per un appuntamento?`,
            `Mi piacerebbe prenotare un servizio.`,
            `Possiamo collaborare?`,
          ],
        });
      }

      const result = await response.json();
      const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        const args = JSON.parse(toolCall.function.arguments);
        return jsonResponse({ messages: args.messages });
      }

      return jsonResponse({
        messages: [
          `Ciao, ti ho trovato su Stayle!`,
          `Sei disponibile oggi?`,
          `Vorrei prenotare un servizio.`,
          `Possiamo collaborare?`,
        ],
      });
    }

    // ===== ACTION: Auto offers for nearby users =====
    if (action === "auto_offers") {
      const { data: pros } = await supabase
        .from("professionals")
        .select("*, profiles:user_id(display_name, city), services(*)")
        .limit(20);

      const offers: any[] = [];
      for (const pro of (pros || [])) {
        const services = (pro.services || []).filter((s: any) => s.active);
        if (services.length > 0) {
          const cheapest = services.sort((a: any, b: any) => a.price - b.price)[0];
          offers.push({
            professional_name: pro.profiles?.display_name || pro.business_name,
            professional_id: pro.id,
            city: pro.profiles?.city || pro.city,
            service_name: cheapest.name,
            original_price: cheapest.price,
            offer_price: Math.round(cheapest.price * 0.9),
            discount: 10,
            type: "auto_discount",
          });
        }
      }

      return jsonResponse({ offers: offers.slice(0, 5) });
    }

    // ===== ACTION: Admin growth stats =====
    if (action === "admin_growth") {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [newUsers, newBookings, newPosts, activeSubs, activeBoosts] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", weekAgo.toISOString()),
        supabase.from("bookings").select("id", { count: "exact", head: true }).gte("created_at", weekAgo.toISOString()),
        supabase.from("posts").select("id", { count: "exact", head: true }).gte("created_at", weekAgo.toISOString()),
        supabase.from("user_subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("profile_boosts").select("id", { count: "exact", head: true }).eq("active", true).gte("expires_at", now.toISOString()),
      ]);

      return jsonResponse({
        weekly: {
          new_users: newUsers.count || 0,
          new_bookings: newBookings.count || 0,
          new_posts: newPosts.count || 0,
        },
        current: {
          active_subscriptions: activeSubs.count || 0,
          active_boosts: activeBoosts.count || 0,
        },
      });
    }

    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("ai-growth-engine error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

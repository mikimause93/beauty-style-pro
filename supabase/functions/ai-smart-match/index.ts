import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, user_id, user_city, user_preferences, user_type, data: reqData } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ===== ACTION: Smart professional matching =====
    if (action === "match_professionals" || !action) {
      const [prosRes, eventsRes, streamsRes] = await Promise.all([
        supabase.from("professionals")
          .select("id, business_name, specialty, city, rating, review_count, hourly_rate, is_verified, user_id")
          .order("rating", { ascending: false })
          .limit(20),
        supabase.from("events")
          .select("id, title, location, start_date, event_type, price")
          .eq("status", "scheduled")
          .order("start_date", { ascending: true })
          .limit(5),
        supabase.from("live_streams")
          .select("id, title, category, viewer_count")
          .eq("status", "live")
          .limit(5),
      ]);

      if (!apiKey) {
        // Fallback: score-based matching without AI
        const scored = (prosRes.data || []).map(p => {
          let score = (p.rating || 0) * 20;
          if (p.is_verified) score += 15;
          if (p.city && user_city && p.city.toLowerCase() === user_city.toLowerCase()) score += 30;
          if (p.review_count && p.review_count > 5) score += 10;
          return { ...p, matchScore: Math.min(score, 100), reason: "Match basato su rating e posizione" };
        }).sort((a, b) => b.matchScore - a.matchScore).slice(0, 5);

        return jsonResponse({
          nearbyPros: scored,
          smartOffers: [],
          aiTips: ["Esplora i professionisti sulla mappa! 📍"],
          greeting: `Ciao! Ho trovato ${scored.length} professionisti per te.`
        });
      }

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `Sei l'agente AI di matching di STYLE. Analizza professionisti e genera suggerimenti personalizzati per l'utente. Rispondi in italiano.`
            },
            {
              role: "user",
              content: `Utente: città=${user_city || "Italia"}, tipo=${user_type || "client"}, preferenze=${(user_preferences || []).join(", ") || "nessuna"}

Professionisti:
${(prosRes.data || []).slice(0, 10).map(p => `- ${p.business_name} (${p.specialty || "beauty"}) ${p.city || "?"}, rating ${p.rating}, €${p.hourly_rate || "?"}/h, verificato: ${p.is_verified}`).join("\n")}

Eventi: ${(eventsRes.data || []).map(e => `${e.title} a ${e.location || "online"}`).join(", ") || "Nessuno"}
Live: ${(streamsRes.data || []).map(s => `${s.title} (${s.viewer_count} spettatori)`).join(", ") || "Nessuno"}

Genera matching personalizzato.`
            },
          ],
          tools: [{
            type: "function",
            function: {
              name: "smart_match",
              description: "Return smart matching results",
              parameters: {
                type: "object",
                properties: {
                  nearbyPros: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        name: { type: "string" },
                        reason: { type: "string" },
                        matchScore: { type: "number" }
                      },
                      required: ["id", "name", "reason", "matchScore"],
                      additionalProperties: false
                    }
                  },
                  smartOffers: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        type: { type: "string" }
                      },
                      required: ["title", "description", "type"],
                      additionalProperties: false
                    }
                  },
                  aiTips: { type: "array", items: { type: "string" } },
                  greeting: { type: "string" }
                },
                required: ["nearbyPros", "smartOffers", "aiTips", "greeting"],
                additionalProperties: false
              }
            }
          }],
          tool_choice: { type: "function", function: { name: "smart_match" } }
        }),
      });

      if (!response.ok) {
        if (response.status === 429) return jsonResponse({ error: "Troppe richieste" }, 429);
        if (response.status === 402) return jsonResponse({ error: "Crediti AI esauriti" }, 402);
        return jsonResponse({ error: "Errore AI" }, 500);
      }

      const result = await response.json();
      const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        return jsonResponse(JSON.parse(toolCall.function.arguments));
      }

      return jsonResponse({
        nearbyPros: [],
        smartOffers: [],
        aiTips: ["Esplora i professionisti sulla mappa!"],
        greeting: "Benvenuto su Stayle!"
      });
    }

    // ===== ACTION: Service matching =====
    if (action === "match_services") {
      const { query, category } = reqData || {};
      
      let servicesQuery = supabase.from("services").select("id, name, category, price, description, duration_minutes").eq("active", true);
      if (category) servicesQuery = servicesQuery.eq("category", category);
      const { data: services } = await servicesQuery.limit(20);

      if (!apiKey || !services?.length) {
        return jsonResponse({ matches: services || [] });
      }

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: "Ordina i servizi per rilevanza rispetto alla query. Rispondi con tool call." },
            { role: "user", content: `Query: "${query || 'servizi beauty'}"\nServizi: ${JSON.stringify(services)}` },
          ],
          tools: [{
            type: "function",
            function: {
              name: "rank_services",
              description: "Return ranked services",
              parameters: {
                type: "object",
                properties: {
                  ranked_ids: { type: "array", items: { type: "string" } },
                  suggestion: { type: "string" }
                },
                required: ["ranked_ids", "suggestion"],
                additionalProperties: false
              }
            }
          }],
          tool_choice: { type: "function", function: { name: "rank_services" } }
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall) {
          const args = JSON.parse(toolCall.function.arguments);
          const ranked = args.ranked_ids
            .map((id: string) => services.find((s: any) => s.id === id))
            .filter(Boolean);
          return jsonResponse({ matches: ranked, suggestion: args.suggestion });
        }
      }

      return jsonResponse({ matches: services });
    }

    // ===== ACTION: Map-based matching =====
    if (action === "map_match") {
      const { lat, lng, radius_km = 10, specialty } = reqData || {};
      
      let query = supabase.from("professionals")
        .select("id, business_name, specialty, city, rating, review_count, latitude, longitude, is_verified, user_id");
      if (specialty) query = query.eq("specialty", specialty);
      const { data: pros } = await query.limit(50);

      // Calculate distances (Haversine)
      const withDistance = (pros || []).map(p => {
        if (!p.latitude || !p.longitude || !lat || !lng) {
          return { ...p, distance_km: 9999 };
        }
        const R = 6371;
        const dLat = (p.latitude - lat) * Math.PI / 180;
        const dLng = (p.longitude - lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat * Math.PI / 180) * Math.cos(p.latitude * Math.PI / 180) *
          Math.sin(dLng/2) * Math.sin(dLng/2);
        const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return { ...p, distance_km: Math.round(d * 10) / 10 };
      })
      .filter(p => p.distance_km <= radius_km)
      .sort((a, b) => {
        // Score: closer + higher rating + verified = better
        const scoreA = (100 - a.distance_km) + (a.rating || 0) * 10 + (a.is_verified ? 20 : 0);
        const scoreB = (100 - b.distance_km) + (b.rating || 0) * 10 + (b.is_verified ? 20 : 0);
        return scoreB - scoreA;
      })
      .slice(0, 10);

      return jsonResponse({ professionals: withDistance, total: withDistance.length });
    }

    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (error) {
    console.error("AI smart-match error:", error);
    return jsonResponse({ error: error.message }, 500);
  }
});

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

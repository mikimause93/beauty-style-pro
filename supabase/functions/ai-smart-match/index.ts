import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_city, user_preferences, user_type } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI non configurata" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch nearby professionals
    const { data: pros } = await supabase
      .from("professionals")
      .select("id, business_name, specialty, city, rating, review_count, hourly_rate, is_verified")
      .order("rating", { ascending: false })
      .limit(20);

    // Fetch active offers/events
    const { data: events } = await supabase
      .from("events")
      .select("id, title, location, start_date, event_type, price")
      .eq("status", "scheduled")
      .order("start_date", { ascending: true })
      .limit(5);

    // Fetch live streams
    const { data: streams } = await supabase
      .from("live_streams")
      .select("id, title, category, viewer_count")
      .eq("status", "live")
      .limit(5);

    const systemPrompt = `Sei l'agente AI di STAYLE, la super app beauty italiana.
Genera suggerimenti personalizzati per l'utente basandoti sui dati disponibili.

Rispondi SEMPRE in JSON valido con questa struttura:
{
  "nearbyPros": [{"id": "string", "name": "string", "reason": "string", "matchScore": number}],
  "smartOffers": [{"title": "string", "description": "string", "type": "string"}],
  "aiTips": ["string"],
  "greeting": "string"
}

Massimo 3 professionisti, 2 offerte, 3 tips. Rispondi in italiano. Sii conciso.`;

    const userPrompt = `Utente in: ${user_city || "Italia"}
Tipo: ${user_type || "client"}
Preferenze: ${user_preferences?.join(", ") || "Nessuna specificata"}

Professionisti disponibili:
${(pros || []).slice(0, 10).map(p => `- ${p.business_name} (${p.specialty || "beauty"}) a ${p.city || "?"}, rating ${p.rating}, €${p.hourly_rate || "?"}/h, verificato: ${p.is_verified ? "sì" : "no"}`).join("\n")}

Eventi attivi:
${(events || []).map(e => `- ${e.title} a ${e.location || "online"}, ${e.start_date}`).join("\n") || "Nessuno"}

Live ora:
${(streams || []).map(s => `- ${s.title} (${s.category}), ${s.viewer_count} spettatori`).join("\n") || "Nessuno"}

Genera suggerimenti personalizzati.`;

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
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Troppe richieste" }), {
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
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "Errore AI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { greeting: content };
    } catch {
      parsed = { greeting: content, nearbyPros: [], smartOffers: [], aiTips: [] };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("AI matching error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

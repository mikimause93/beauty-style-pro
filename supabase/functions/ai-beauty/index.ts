import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // ── Verifica JWT ─────────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Token di autenticazione mancante" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );
  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace("Bearer ", "")
  );
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Autenticazione fallita" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { action, data } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI non configurata" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let systemPrompt = "";
    let userPrompt = "";

    switch (action) {
      case "job_match": {
        const { applicantSkills, applicantExperience, jobRequirements, jobDescription } = data;
        systemPrompt = "Sei un esperto HR nel settore beauty e wellness. Analizza la compatibilità tra un candidato e un annuncio di lavoro. Rispondi SEMPRE in JSON valido con questa struttura: {\"matchScore\": number 0-100, \"strengths\": [string], \"gaps\": [string], \"recommendations\": [string], \"summary\": string}";
        userPrompt = `Candidato:\n- Competenze: ${applicantSkills?.join(", ") || "Non specificate"}\n- Esperienza: ${applicantExperience || "Non specificata"} anni\n\nAnnuncio:\n- Requisiti: ${jobRequirements?.join(", ") || "Non specificati"}\n- Descrizione: ${jobDescription || "Non disponibile"}\n\nAnalizza la compatibilità.`;
        break;
      }

      case "generate_description": {
        const { serviceName, category, targetAudience } = data;
        systemPrompt = "Sei un copywriter esperto nel settore beauty e wellness italiano. Genera descrizioni accattivanti per servizi di bellezza. Rispondi in italiano con una descrizione professionale di 2-3 frasi.";
        userPrompt = `Genera una descrizione per il servizio "${serviceName}" nella categoria "${category || "beauty"}". Target: ${targetAudience || "clienti generici"}.`;
        break;
      }

      case "suggest_services": {
        const { userPreferences, currentServices, city } = data;
        systemPrompt = "Sei un consulente beauty esperto. Suggerisci servizi personalizzati basandoti sulle preferenze dell'utente. Rispondi SEMPRE in JSON valido: {\"suggestions\": [{\"name\": string, \"reason\": string, \"estimatedPrice\": string}], \"tip\": string}";
        userPrompt = `Preferenze: ${userPreferences?.join(", ") || "Non specificate"}\nServizi disponibili: ${currentServices?.join(", ") || "Vari"}\nCittà: ${city || "Italia"}\n\nSuggerisci 3-5 servizi personalizzati.`;
        break;
      }

      default:
        return new Response(JSON.stringify({ error: "Azione non valida" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "";

    // Try to parse JSON response
    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { text: content };
    } catch {
      parsed = { text: content };
    }

    return new Response(JSON.stringify({ success: true, data: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

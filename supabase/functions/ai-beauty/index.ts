import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!apiKey) {
      return jsonResponse({ error: "AI non configurata" }, 500);
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
        return jsonResponse({ error: "Azione non valida" }, 400);
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

    if (!response.ok) {
      if (response.status === 429) return jsonResponse({ error: "Troppe richieste, riprova tra poco" }, 429);
      console.error("ai-beauty AI gateway error:", response.status);
      return jsonResponse({ error: "Servizio AI non disponibile" }, 502);
    }

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

    return jsonResponse({ success: true, data: parsed });

  } catch (error: unknown) {
    console.error("ai-beauty error:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});

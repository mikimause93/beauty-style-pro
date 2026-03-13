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
    const { messages, stream } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI non configurata" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Sei "Beauty AI", l'assistente virtuale di Style, la super app italiana per il settore beauty & wellness.

Il tuo ruolo:
- Consigliare tagli, colori, trattamenti e prodotti personalizzati
- Suggerire routine di skincare e haircare
- Aiutare a scegliere servizi e professionisti
- Rispondere in italiano in modo amichevole, professionale e conciso
- Usare emoji con moderazione per rendere le risposte piacevoli
- Se non sai qualcosa, suggerisci di consultare un professionista sulla piattaforma

Non parlare mai di altre app o competitor. Promuovi sempre l'ecosistema Style.
Rispondi in massimo 3-4 paragrafi brevi.`;

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
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 800,
        stream: !!stream,
      }),
    });

    const FALLBACK_CONTENT = "Ciao! 👋 Al momento il servizio AI è temporaneamente offline. Puoi consultare i nostri professionisti su /stylists per consigli personalizzati. Tornerò presto! ✨";

    if (!response.ok) {
      if (response.status === 429 || response.status === 402) {
        return new Response(JSON.stringify({ content: FALLBACK_CONTENT }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("AI gateway error:", response.status);
      return new Response(JSON.stringify({ content: FALLBACK_CONTENT }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Stream mode - pass through SSE
    if (stream) {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "Mi dispiace, non riesco a rispondere.";

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("AI assistant error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

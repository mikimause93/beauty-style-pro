import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { spokenText, targetLanguage } = await req.json();
    
    if (!spokenText || spokenText.trim().length === 0) {
      return new Response(JSON.stringify({ error: "spokenText is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    if (!ELEVENLABS_API_KEY) throw new Error("ELEVENLABS_API_KEY not configured");

    // Step 1: Translate with Lovable AI
    const langMap: Record<string, string> = {
      it: "Italian", en: "English", es: "Spanish", fr: "French",
      de: "German", pt: "Portuguese", ar: "Arabic", zh: "Chinese",
      ja: "Japanese", ko: "Korean", ru: "Russian", hi: "Hindi",
      tr: "Turkish", nl: "Dutch", pl: "Polish", sv: "Swedish",
    };
    const targetLangName = langMap[targetLanguage] || targetLanguage || "English";

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are a real-time interpreter. Translate the following spoken text to ${targetLangName}. Return ONLY the translated text, nothing else. Keep it natural and conversational.`,
          },
          { role: "user", content: spokenText },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI translation error:", aiResponse.status, errText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Translation failed");
    }

    const aiData = await aiResponse.json();
    const translatedText = aiData.choices?.[0]?.message?.content?.trim() || spokenText;

    // Step 2: Convert translated text to speech with ElevenLabs
    const voiceId = "EXAVITQu4vr4xnSDxMaL"; // Sarah - natural female voice
    
    const ttsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_22050_32`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: translatedText.slice(0, 500),
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.3,
            use_speaker_boost: true,
            speed: 1.1, // Slightly faster for real-time feel
          },
        }),
      }
    );

    if (!ttsResponse.ok) {
      console.error("ElevenLabs TTS error:", ttsResponse.status);
      // Return translation text only if TTS fails
      return new Response(JSON.stringify({ translatedText, audioAvailable: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const audioBuffer = await ttsResponse.arrayBuffer();
    const { encode: base64Encode } = await import("https://deno.land/std@0.168.0/encoding/base64.ts");
    const audioBase64 = base64Encode(audioBuffer);

    return new Response(JSON.stringify({
      translatedText,
      audioBase64,
      audioAvailable: true,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Translate-speak error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

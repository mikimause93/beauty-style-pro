import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { audioUrl, audioBase64, mimeType, targetLanguage } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    let audioBytes: Uint8Array;
    let contentType = mimeType || "audio/webm";

    if (audioBase64) {
      const bin = atob(audioBase64);
      audioBytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) audioBytes[i] = bin.charCodeAt(i);
    } else if (audioUrl) {
      const r = await fetch(audioUrl);
      if (!r.ok) throw new Error("Cannot fetch audio");
      contentType = r.headers.get("content-type") || contentType;
      audioBytes = new Uint8Array(await r.arrayBuffer());
    } else {
      return new Response(JSON.stringify({ error: "audioUrl or audioBase64 required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ext = contentType.includes("mp4") ? "mp4"
      : contentType.includes("mpeg") ? "mp3"
      : contentType.includes("wav") ? "wav"
      : "webm";

    const form = new FormData();
    form.append("model", "openai/gpt-4o-mini-transcribe");
    form.append("file", new Blob([audioBytes], { type: contentType }), `audio.${ext}`);

    const sttResp = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: form,
    });

    if (!sttResp.ok) {
      const t = await sttResp.text();
      console.error("STT error", sttResp.status, t);
      return new Response(JSON.stringify({ error: "Transcription failed" }), {
        status: sttResp.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sttData = await sttResp.json();
    const transcript: string = sttData.text || "";

    let translated = transcript;
    if (targetLanguage && transcript.trim().length > 0) {
      const langMap: Record<string, string> = {
        it: "Italian", en: "English", es: "Spanish", fr: "French",
        de: "German", pt: "Portuguese", ar: "Arabic", zh: "Chinese",
        ja: "Japanese", ko: "Korean", ru: "Russian",
      };
      const targetName = langMap[targetLanguage] || targetLanguage;
      const trResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { role: "system", content: `Translate to ${targetName}. Return ONLY the translation. If already in ${targetName}, return as-is.` },
            { role: "user", content: transcript },
          ],
        }),
      });
      if (trResp.ok) {
        const trData = await trResp.json();
        translated = trData.choices?.[0]?.message?.content?.trim() || transcript;
      }
    }

    return new Response(JSON.stringify({ transcript, translated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("voice-transcribe error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ 
        error: "AI service temporarily unavailable",
        fallback: true,
        message: "Il servizio AI Preview è temporaneamente offline. Riprova più tardi."
      }), { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { session_id, sector, style_name, prompt } = await req.json();

    if (!session_id) throw new Error("session_id required");

    // Check AI credits
    const { data: credits } = await supabase
      .from("ai_credits")
      .select("balance")
      .eq("user_id", user.id)
      .single();

    if (!credits || credits.balance < 1) {
      return new Response(JSON.stringify({ 
        error: "Crediti AI insufficienti. Acquista crediti per continuare.",
        credits_needed: true 
      }), { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // Update session status
    await supabase
      .from("preview_sessions")
      .update({ status: "processing" })
      .eq("id", session_id);

    // Build prompt based on sector
    const sectorPrompts: Record<string, string> = {
      hair: `Professional hairstyle preview: ${style_name || "modern elegant hairstyle"}. Photorealistic, salon quality, natural lighting, front-facing portrait.`,
      barber: `Professional barber cut preview: ${style_name || "clean fade haircut"}. Photorealistic, barbershop quality, sharp lines.`,
      tattoo: `Tattoo design preview: ${style_name || "minimalist floral tattoo"}. Clean lines, professional tattoo art, on skin mockup.`,
      makeup: `Professional makeup look: ${style_name || "elegant evening makeup"}. Photorealistic, beauty editorial quality, natural skin.`,
      nails: `Nail art design: ${style_name || "modern gel nail art"}. Close-up, salon quality, trendy design.`,
      beauty: `Beauty treatment result: ${style_name || "radiant skin treatment"}. Before/after style, professional quality.`,
    };

    const aiPrompt = prompt || sectorPrompts[sector] || sectorPrompts.hair;

    // Call Lovable AI for image generation
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [
          {
            role: "user",
            content: `Generate a high-quality preview image: ${aiPrompt}. Make it photorealistic and professional.`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorStatus = aiResponse.status;
      if (errorStatus === 429) {
        await supabase
          .from("preview_sessions")
          .update({ status: "failed" })
          .eq("id", session_id);
        return new Response(JSON.stringify({ 
          error: "Troppi tentativi. Riprova tra qualche minuto.",
          rate_limited: true 
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (errorStatus === 402) {
        await supabase
          .from("preview_sessions")
          .update({ status: "failed" })
          .eq("id", session_id);
        return new Response(JSON.stringify({ 
          error: "Servizio AI temporaneamente non disponibile.",
          payment_required: true 
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI generation failed: ${errorStatus}`);
    }

    const aiData = await aiResponse.json();
    const generatedContent = aiData.choices?.[0]?.message?.content || "Preview generata con successo";

    // Extract image URL if present in response
    let generatedImageUrl = null;
    // Check for inline_data images in the response
    const parts = aiData.choices?.[0]?.message?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inline_data?.mime_type?.startsWith("image/")) {
          // Upload base64 image to storage
          const base64Data = part.inline_data.data;
          const mimeType = part.inline_data.mime_type;
          const ext = mimeType.includes("png") ? "png" : "jpg";
          const fileName = `preview-${session_id}.${ext}`;
          
          const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          
          await supabase.storage.from("look-photos").upload(
            `previews/${fileName}`,
            binaryData,
            { contentType: mimeType, upsert: true }
          );

          const { data: urlData } = supabase.storage
            .from("look-photos")
            .getPublicUrl(`previews/${fileName}`);
          
          generatedImageUrl = urlData.publicUrl;
        }
      }
    }

    // Update session as completed
    await supabase
      .from("preview_sessions")
      .update({
        status: "completed",
        generated_image_url: generatedImageUrl,
        ai_model_used: "gemini-3.1-flash-image",
        ai_prompt: aiPrompt,
        processing_time_seconds: 5,
      })
      .eq("id", session_id);

    // Deduct credit
    await supabase
      .from("ai_credits")
      .update({ balance: credits.balance - 1, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);

    // Log transaction
    await supabase.from("ai_credit_transactions").insert({
      user_id: user.id,
      transaction_type: "usage",
      amount: -1,
      balance_after: credits.balance - 1,
      description: `AI Preview - ${sector}: ${style_name || "custom"}`,
      metadata: { session_id, sector },
    });

    return new Response(
      JSON.stringify({
        success: true,
        session_id,
        generated_image_url: generatedImageUrl,
        ai_description: generatedContent,
        credits_remaining: credits.balance - 1,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("AI Preview error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

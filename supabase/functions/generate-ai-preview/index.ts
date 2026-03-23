// supabase/functions/generate-ai-preview/index.ts
// Edge Function: Generate AI Beauty Preview
// See pasted.txt at repository root for the full canonical specification

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(authHeader.replace("Bearer ", ""));

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { session_id, style_prompt, original_image_url } = body;

    if (!session_id || !style_prompt) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: session_id, style_prompt" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update session status to processing
    await supabaseClient
      .from("ai_preview_sessions")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .eq("id", session_id)
      .eq("user_id", user.id);

    const stabilityApiKey = Deno.env.get("STABILITY_API_KEY");
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    let resultImageUrl = "";
    let tokensUsed = 0;

    if (stabilityApiKey) {
      // Primary: Stability AI
      const stabilityResponse = await fetch(
        "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${stabilityApiKey}`,
          },
          body: JSON.stringify({
            text_prompts: [
              {
                text: `Beauty portrait, ${style_prompt}, professional photo, high quality, realistic`,
                weight: 1,
              },
              {
                text: "blurry, low quality, distorted, deformed",
                weight: -1,
              },
            ],
            cfg_scale: 7,
            height: 1024,
            width: 1024,
            steps: 30,
            samples: 1,
          }),
        }
      );

      if (stabilityResponse.ok) {
        const stabilityData = await stabilityResponse.json();
        const base64Image = stabilityData.artifacts[0]?.base64;

        if (base64Image) {
          const imageBuffer = Uint8Array.from(atob(base64Image), (c) => c.charCodeAt(0));
          const fileName = `ai-previews/${user.id}/${session_id}.png`;

          const { data: uploadData, error: uploadError } = await supabaseClient.storage
            .from("media")
            .upload(fileName, imageBuffer, {
              contentType: "image/png",
              upsert: true,
            });

          if (!uploadError && uploadData) {
            const { data: publicUrlData } = supabaseClient.storage
              .from("media")
              .getPublicUrl(fileName);
            resultImageUrl = publicUrlData.publicUrl;
          }
        }
        tokensUsed = 30;
      }
    } else if (openaiApiKey) {
      // Fallback: OpenAI DALL-E 3
      const dalleResponse = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: `Beauty portrait photo. Style: ${style_prompt}. Professional lighting, high quality, realistic.`,
          n: 1,
          size: "1024x1024",
          quality: "standard",
        }),
      });

      if (dalleResponse.ok) {
        const dalleData = await dalleResponse.json();
        resultImageUrl = dalleData.data[0]?.url ?? "";
        tokensUsed = 1;
      }
    }

    if (!resultImageUrl) {
      await supabaseClient
        .from("ai_preview_sessions")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", session_id);

      return new Response(JSON.stringify({ error: "Failed to generate preview" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark session as completed
    await supabaseClient
      .from("ai_preview_sessions")
      .update({
        status: "completed",
        result_image_url: resultImageUrl,
        tokens_used: tokensUsed,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session_id);

    // Track usage
    await supabaseClient.rpc("increment_ai_preview_usage", {
      p_user_id: user.id,
    });

    return new Response(
      JSON.stringify({
        success: true,
        result_image_url: resultImageUrl,
        tokens_used: tokensUsed,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

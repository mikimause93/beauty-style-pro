// supabase/functions/generate-ai-preview/index.ts
// Edge Function: Generate AI beauty preview using DALL-E 3
// Deployed on Supabase (Deno runtime)

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://esm.sh/openai@4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PreviewRequest {
  prompt: string;
  style_type: 'hair' | 'makeup' | 'nails' | 'full_look';
  input_image_url?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiKey = Deno.env.get('OPENAI_API_KEY');

    if (!supabaseUrl || !serviceRoleKey || !openaiKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const body: PreviewRequest = await req.json();
    const { prompt, style_type, input_image_url } = body;

    if (!prompt || !style_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: prompt, style_type' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check monthly usage limit (free tier: 10 previews/month)
    const monthYear = new Date().toISOString().slice(0, 7);
    const { data: usage } = await supabase
      .from('ai_preview_usage')
      .select('previews_used')
      .eq('user_id', user.id)
      .eq('month_year', monthYear)
      .maybeSingle();

    const MONTHLY_LIMIT = 10; // Free tier limit
    if (usage && usage.previews_used >= MONTHLY_LIMIT) {
      return new Response(
        JSON.stringify({
          error: 'Monthly preview limit reached',
          limit: MONTHLY_LIMIT,
          used: usage.previews_used,
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create job record in pending state
    const { data: job, error: jobError } = await supabase
      .from('ai_preview_jobs')
      .insert({
        user_id: user.id,
        prompt,
        style_type,
        input_image_url: input_image_url ?? null,
        status: 'processing',
      })
      .select()
      .single();

    if (jobError || !job) {
      throw new Error(`Failed to create job: ${jobError?.message}`);
    }

    // Build enhanced prompt for DALL-E 3
    const stylePrompts: Record<string, string> = {
      hair: 'professional beauty salon photo, photorealistic portrait',
      makeup: 'professional makeup studio photo, photorealistic portrait',
      nails: 'professional nail salon photo, detailed close-up',
      full_look: 'professional beauty salon photo, full look transformation, photorealistic',
    };

    const fullPrompt = `${stylePrompts[style_type] ?? 'professional beauty photo'}. ${prompt}. High quality, sharp focus, studio lighting, 4K resolution.`;

    // Call OpenAI DALL-E 3
    const openai = new OpenAI({ apiKey: openaiKey });

    const imageResponse = await openai.images.generate({
      model: 'dall-e-3',
      prompt: fullPrompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    });

    const resultImageUrl = imageResponse.data[0]?.url;

    if (!resultImageUrl) {
      throw new Error('No image returned from OpenAI');
    }

    // Update job with result
    await supabase
      .from('ai_preview_jobs')
      .update({
        status: 'completed',
        result_image_url: resultImageUrl,
        tokens_used: 1,
        model_used: 'dall-e-3',
      })
      .eq('id', job.id);

    // Upsert monthly usage counter
    await supabase.from('ai_preview_usage').upsert(
      {
        user_id: user.id,
        month_year: monthYear,
        previews_used: (usage?.previews_used ?? 0) + 1,
        tokens_used: (usage?.tokens_used ?? 0) + 1,
      },
      { onConflict: 'user_id,month_year' }
    );

    return new Response(
      JSON.stringify({
        job_id: job.id,
        result_image_url: resultImageUrl,
        style_type,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[generate-ai-preview] Error:', message);

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

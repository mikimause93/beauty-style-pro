import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Server-to-server auth
    const secret = req.headers.get('x-internal-secret');
    const expected = Deno.env.get('INTERNAL_SECRET');
    if (!expected || secret !== expected) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const now = new Date().toISOString();

    // Fetch pending scheduled actions that are due
    const { data: pendingActions, error: fetchError } = await supabase
      .from("stella_scheduled_actions")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_for", now)
      .limit(50);

    if (fetchError) throw fetchError;

    const results: Array<{ id: string; status: string }> = [];

    for (const action of pendingActions || []) {
      try {
        // Execute based on action_type
        switch (action.action_type) {
          case "send_message": {
            const params = action.action_params as Record<string, string>;
            if (params?.conversation_id && params?.content) {
              await supabase.from("messages").insert({
                conversation_id: params.conversation_id,
                sender_id: action.user_id,
                content: params.content,
              });
            }
            break;
          }
          case "booking_reminder": {
            const params = action.action_params as Record<string, string>;
            await supabase.rpc("create_notification", {
              _user_id: action.user_id,
              _title: "⏰ Promemoria Stella",
              _message: params?.message || "Hai un promemoria programmato!",
              _type: "reminder",
              _data: { source: "stella_scheduled" },
            });
            break;
          }
          case "post_reminder": {
            const params = action.action_params as Record<string, string>;
            await supabase.rpc("create_notification", {
              _user_id: action.user_id,
              _title: "📝 Promemoria Post",
              _message: params?.message || "È ora di pubblicare un post!",
              _type: "reminder",
              _data: { source: "stella_scheduled", target: "/create-post" },
            });
            break;
          }
          default: {
            // Generic notification reminder
            const params = action.action_params as Record<string, string>;
            await supabase.rpc("create_notification", {
              _user_id: action.user_id,
              _title: "🤖 Stella - Azione Programmata",
              _message: params?.message || "Azione programmata eseguita!",
              _type: "info",
              _data: { source: "stella_scheduled" },
            });
          }
        }

        // Mark as executed
        await supabase
          .from("stella_scheduled_actions")
          .update({ status: "executed", executed_at: now })
          .eq("id", action.id);

        results.push({ id: action.id, status: "executed" });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        await supabase
          .from("stella_scheduled_actions")
          .update({ status: "failed", error_message: errorMessage })
          .eq("id", action.id);

        results.push({ id: action.id, status: "failed" });
      }
    }

    return new Response(
      JSON.stringify({ processed: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

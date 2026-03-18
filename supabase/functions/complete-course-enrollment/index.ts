import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, courseId, paymentAmount, paymentMethod } = await req.json();

    if (!userId || !courseId) {
      return new Response(JSON.stringify({ error: "userId and courseId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: course, error: courseError } = await supabaseClient
      .from("courses")
      .select("creator_id, price, title, enrolled_count")
      .eq("id", courseId)
      .single();

    if (courseError || !course) {
      return new Response(JSON.stringify({ error: "Course not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: enrollError } = await supabaseClient.from("enrollments").insert({
      user_id: userId,
      course_id: courseId,
      payment_amount: paymentAmount || course.price,
      payment_method: paymentMethod || "stripe",
      progress: 0,
    });

    if (enrollError) {
      return new Response(JSON.stringify({ error: enrollError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabaseClient
      .from("courses")
      .update({ enrolled_count: (course as any).enrolled_count + 1 || 1 })
      .eq("id", courseId);

    if (paymentAmount > 0 && course.creator_id) {
      // Fetch creator's tier-based revenue share percentage
      const { data: creatorProfile } = await supabaseClient
        .from("creator_profiles")
        .select("revenue_share_percentage")
        .eq("id", course.creator_id)
        .maybeSingle();

      const revenueSharePct = (creatorProfile?.revenue_share_percentage ?? 70) / 100;
      const platformFee = paymentAmount * (1 - revenueSharePct);
      const netAmount = paymentAmount * revenueSharePct;

      await supabaseClient.from("creator_earnings").insert({
        creator_id: course.creator_id,
        source_type: "course_sale",
        source_id: courseId,
        gross_amount: paymentAmount,
        platform_fee: platformFee,
        net_amount: netAmount,
        status: "approved",
      });

      // Fetch current values then increment atomically
      const { data: currentStats } = await supabaseClient
        .from("creator_profiles")
        .select("total_revenue, total_courses_sold")
        .eq("id", course.creator_id)
        .maybeSingle();

      await supabaseClient
        .from("creator_profiles")
        .update({
          total_revenue: (currentStats?.total_revenue ?? 0) + netAmount,
          total_courses_sold: (currentStats?.total_courses_sold ?? 0) + 1,
        })
        .eq("id", course.creator_id);
    }

    await supabaseClient.from("notifications").insert({
      user_id: userId,
      title: "🎉 Iscrizione completata!",
      message: `Sei ora iscritto al corso "${course.title}". Inizia subito!`,
      type: "course_enrollment",
      metadata: { course_id: courseId },
      read: false,
    });

    return new Response(
      JSON.stringify({ success: true, message: "Enrollment completed" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

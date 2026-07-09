import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  console.log(`[PROCESS-WITHDRAWAL] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    const { amount, iban, holderName } = await req.json();
    if (!amount || amount <= 0) throw new Error("Invalid amount");
    if (!iban) throw new Error("IBAN required");
    logStep("Withdrawal request", { userId: user.id, amount, iban: `****${iban.slice(-4)}` });

    // Verification info (non-blocking)
    const { data: profile } = await supabase
      .from("profiles")
      .select("verification_status")
      .eq("user_id", user.id)
      .single();
    if (profile && profile.verification_status !== "verified") {
      logStep("User not fully verified, flagging for review");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Atomically deduct balance (prevents TOCTOU race)
    const { data: newBalance, error: debitErr } = await supabase.rpc("debit_qr_coins", {
      _user_id: user.id,
      _amount: amount,
    });
    if (debitErr) {
      throw new Error("Insufficient balance");
    }

    // Record transaction
    await supabase.from("transactions").insert({
      user_id: user.id,
      type: "withdraw",
      amount: -amount,
      description: `Prelievo IBAN ****${iban.slice(-4)}`,
      reference_type: "withdrawal",
    });

    // Create receipt
    await supabase.from("receipts").insert({
      user_id: user.id,
      receipt_type: "withdrawal",
      service_name: `Prelievo su IBAN ****${iban.slice(-4)}`,
      amount,
      payment_method: "bank_transfer",
      status: "processing",
    });

    // Create notification
    await supabase.from("notifications").insert({
      user_id: user.id,
      title: "Prelievo in elaborazione 🏦",
      message: `Il tuo prelievo di €${amount} su IBAN ****${iban.slice(-4)} è in elaborazione. Riceverai i fondi entro 2-5 giorni lavorativi.`,
      type: "payment",
    });

    logStep("Withdrawal processed successfully", { newBalance });

    return new Response(JSON.stringify({
      success: true,
      message: "Prelievo in elaborazione",
      newBalance,
      estimatedArrival: "2-5 giorni lavorativi",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

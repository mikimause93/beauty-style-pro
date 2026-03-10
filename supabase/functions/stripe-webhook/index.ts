import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  console.log(`[STRIPE-WEBHOOK] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) {
    return new Response("STRIPE_SECRET_KEY not set", { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const body = await req.text();
    const event = JSON.parse(body) as Stripe.Event;
    logStep("Event received", { type: event.type });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const customerEmail = session.customer_email || session.customer_details?.email;
        logStep("Checkout completed", { userId, customerEmail, mode: session.mode });

        if (userId && session.mode === "payment") {
          // One-off payment - create receipt
          await supabase.from("receipts").insert({
            user_id: userId,
            receipt_type: "payment",
            service_name: "Pagamento Stripe",
            amount: (session.amount_total || 0) / 100,
            payment_method: "stripe",
            status: "paid",
            stripe_session_id: session.id,
          });
          logStep("Receipt created for one-off payment");
        }

        if (userId && session.mode === "subscription") {
          // Create notification for subscription
          await supabase.from("notifications").insert({
            user_id: userId,
            title: "Abbonamento Attivato ✅",
            message: "Il tuo abbonamento STYLE è stato attivato con successo!",
            type: "subscription",
          });
          logStep("Subscription notification sent");
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerEmail = typeof invoice.customer_email === 'string' ? invoice.customer_email : null;
        logStep("Invoice paid", { customerEmail, amount: invoice.amount_paid });

        if (customerEmail) {
          // Find user by email
          const { data: profile } = await supabase
            .from("profiles")
            .select("user_id")
            .eq("user_id", (await supabase.auth.admin.listUsers()).data.users.find(u => u.email === customerEmail)?.id || "")
            .single();

          if (profile) {
            await supabase.from("receipts").insert({
              user_id: profile.user_id,
              receipt_type: "subscription",
              service_name: "Abbonamento STAYLE",
              amount: (invoice.amount_paid || 0) / 100,
              payment_method: "stripe",
              status: "paid",
            });
            logStep("Receipt created for invoice");
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription cancelled", { subId: subscription.id });
        // Notification handled by check-subscription polling
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

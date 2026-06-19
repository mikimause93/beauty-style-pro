import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SmartReminder {
  id: string;
  user_id: string;
  service_type: string;
  service_name: string;
  last_service_date: string;
  next_suggested_date: string;
  professional_id: string | null;
  reminder_sent: boolean;
  frequency_days: number;
  priority: string;
  notes: string | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Server-to-server auth
    const secret = req.headers.get('x-internal-secret');
    const expected = Deno.env.get('INTERNAL_SECRET');
    if (!expected || secret !== expected) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { action } = await req.json();

    if (action === 'process_reminders') {
      return await processReminders(supabaseClient);
    } else if (action === 'send_notifications') {
      return await sendNotifications(supabaseClient);
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );

  } catch (error: unknown) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function processReminders(supabase: any) {
  const today = new Date().toISOString().split('T')[0];
  
  // Trova promemoria che devono essere inviati (oggi o in ritardo)
  const { data: reminders, error } = await supabase
    .from('smart_reminders')
    .select(`
      *,
      profiles:user_id(display_name, phone),
      professionals(business_name, profiles:user_id(display_name, phone))
    `)
    .eq('status', 'active')
    .eq('reminder_sent', false)
    .lte('next_suggested_date', today);

  if (error) {
    throw new Error(`Error fetching reminders: ${error.message}`);
  }

  if (!reminders || reminders.length === 0) {
    return new Response(
      JSON.stringify({ message: 'No reminders to process', processed: 0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  let processed = 0;

  for (const reminder of reminders) {
    try {
      // Crea notifica per il cliente
      const clientNotification = await supabase
        .from('notifications')
        .insert({
          user_id: reminder.user_id,
          title: '⏰ È ora del prossimo appuntamento!',
          message: `Il tuo ${reminder.service_name.toLowerCase()} necessita un ritocco. Prenota ora per mantenere il tuo look perfetto!`,
          type: 'reminder',
          data: {
            reminder_id: reminder.id,
            service_type: reminder.service_type,
            professional_id: reminder.professional_id,
            priority: reminder.priority
          }
        });

      if (clientNotification.error) {
        console.error('Error creating client notification:', clientNotification.error);
        continue;
      }

      // Se c'è un professionista associato, notifica anche lui
      if (reminder.professional_id) {
        const professionalUserId = reminder.professionals?.profiles?.user_id;
        if (professionalUserId) {
          await supabase
            .from('notifications')
            .insert({
              user_id: professionalUserId,
              title: '💼 Cliente da ricontattare',
              message: `${reminder.profiles?.display_name || 'Un cliente'} potrebbe aver bisogno di un nuovo ${reminder.service_name.toLowerCase()}`,
              type: 'business_reminder',
              data: {
                reminder_id: reminder.id,
                client_id: reminder.user_id,
                service_type: reminder.service_type
              }
            });
        }
      }

      // Aggiorna il promemoria come inviato
      await supabase
        .from('smart_reminders')
        .update({
          reminder_sent: true,
          reminder_sent_at: new Date().toISOString()
        })
        .eq('id', reminder.id);

      processed++;
    } catch (err) {
      console.error(`Error processing reminder ${reminder.id}:`, err);
    }
  }

  return new Response(
    JSON.stringify({ 
      message: `Processed ${processed} reminders`,
      processed,
      total_found: reminders.length
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function sendNotifications(supabase: any) {
  // Qui potresti integrare con servizi di notifica push, SMS, WhatsApp, etc.
  
  const { data: pendingNotifications, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('type', 'reminder')
    .eq('read', false)
    .limit(50);

  if (error) {
    throw new Error(`Error fetching notifications: ${error.message}`);
  }

  // Simula invio notifiche (qui implementeresti la logica per servizi esterni)
  console.log(`Found ${pendingNotifications?.length || 0} notifications to send`);

  return new Response(
    JSON.stringify({ 
      message: 'Notifications processed',
      sent: pendingNotifications?.length || 0
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
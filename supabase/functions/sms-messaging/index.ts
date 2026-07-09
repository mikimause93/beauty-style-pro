// SMS messaging edge function  
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface SMSMessageRequest {
  phone: string;
  message: string;
  type?: 'promotional' | 'transactional';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Server-to-server auth
    const secret = req.headers.get('x-internal-secret');
    const expected = Deno.env.get('INTERNAL_SECRET');
    if (!expected || secret !== expected) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { phone, message, type = 'transactional' } = 
      await req.json() as SMSMessageRequest;

    // Validate input
    if (!phone || !message) {
      return new Response(
        JSON.stringify({ error: 'Phone and message are required' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate Italian phone number format
    const italianPhoneRegex = /^(\+39)?[0-9]{10}$/;
    if (!italianPhoneRegex.test(phone.replace(/\s/g, ''))) {
      return new Response(
        JSON.stringify({ error: 'Invalid Italian phone number format' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For demo purposes, log the SMS that would be sent
    console.log(`SMS would be sent to ${phone}: ${message}`);
    
    // In production, you would integrate with SMS provider
    // Example with Twilio SMS API:
    /*
    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
    const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER');

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: TWILIO_PHONE_NUMBER,
          To: phone,
          Body: message,
        }),
      }
    );
    */

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'SMS sent successfully',
        phone,
        content: message,
        type 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error('SMS messaging error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send SMS' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
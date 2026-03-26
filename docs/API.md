# API Documentation

## Overview

Beauty Style Pro exposes its backend via two layers:

1. **Supabase Auto-Generated REST API** — every table in the database automatically gets full CRUD endpoints via PostgREST.
2. **Custom Edge Functions** — serverless Deno functions for business logic (payments, AI, notifications, etc.).

---

## Supabase REST API

Base URL: `https://<your-project>.supabase.co/rest/v1/`

Authentication: pass the `apikey` header (anon key for public endpoints, service role key for admin).

```http
GET /rest/v1/services?select=*&category=eq.hairstyle
Authorization: Bearer <anon_key>
apikey: <anon_key>
```

Full PostgREST documentation: https://postgrest.org/en/stable/

### Generating Interactive Docs

Supabase Studio provides a built-in API explorer at:
`https://supabase.com/dashboard/project/<project-id>/api`

You can also generate an OpenAPI spec via:

```bash
curl https://<your-project>.supabase.co/rest/v1/ \
  -H "apikey: <anon_key>" \
  -H "Accept: application/openapi+json" > openapi.json
```

Then import `openapi.json` into tools like **Swagger UI**, **Redoc**, or **Postman**.

---

## Edge Functions

Base URL: `https://<your-project>.supabase.co/functions/v1/`

| Function               | Method | Description                                 |
| ---------------------- | ------ | ------------------------------------------- |
| `create-booking`       | POST   | Create a booking + Stripe payment intent    |
| `process-payment`      | POST   | Complete Stripe/PayPal payment              |
| `send-notification`    | POST   | Send push notification via OneSignal/FCM    |
| `stella-command`       | POST   | Process Stella AI voice command (GPT-4)     |
| `generate-certificate` | POST   | Generate PDF certificate for Academy course |
| `stripe-webhook`       | POST   | Handle Stripe webhook events                |
| `whatsapp-send`        | POST   | Send WhatsApp Business message              |
| `media-moderate`       | POST   | NSFW detection + virus scan for uploads     |

### Invoking Edge Functions (client-side)

```typescript
import { supabase } from "@/integrations/supabase/client";

const { data, error } = await supabase.functions.invoke("create-booking", {
  body: {
    service_id: "...",
    provider_id: "...",
    booking_date: "2026-04-01",
    booking_time: "10:00",
    payment_method: "stripe",
  },
});
```

### Deploying Edge Functions

```bash
# Deploy a single function
supabase functions deploy create-booking

# Deploy all functions
supabase functions deploy

# Set secrets
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
```

---

## Authentication

Supabase Auth exposes endpoints under `/auth/v1/`:

- `POST /auth/v1/signup` — register with email/password
- `POST /auth/v1/token?grant_type=password` — sign in
- `POST /auth/v1/otp` — send OTP to phone number
- `POST /auth/v1/verify` — verify OTP
- `GET /auth/v1/user` — get current user (requires JWT)

---

## Rate Limiting

- Anonymous requests: **60 req/min** per IP
- Authenticated requests: **200 req/min** per user
- Edge Functions: configurable per function

Custom rate limits are stored in the `rate_limits` table and enforced via RLS policies and Edge Function middleware.

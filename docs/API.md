# API Documentation

Beauty Style Pro exposes its API through Supabase auto-generated REST endpoints and custom Edge Functions.

## Base URL

```
https://<your-project>.supabase.co
```

## Authentication

All requests must include a valid JWT in the `Authorization` header:

```http
Authorization: Bearer <jwt_token>
```

Obtain a JWT via the Supabase Auth API (`/auth/v1/token`).

## REST API (Auto-generated)

Supabase auto-generates RESTful endpoints for all tables. Example:

### Profiles

| Method | Path                             | Description        |
| ------ | -------------------------------- | ------------------ |
| GET    | `/rest/v1/profiles`              | List profiles      |
| GET    | `/rest/v1/profiles?id=eq.<uuid>` | Get single profile |
| PATCH  | `/rest/v1/profiles?id=eq.<uuid>` | Update profile     |

### Bookings

| Method | Path                             | Description                                |
| ------ | -------------------------------- | ------------------------------------------ |
| GET    | `/rest/v1/bookings`              | List user bookings                         |
| POST   | `/rest/v1/bookings`              | Create booking (use Edge Function instead) |
| PATCH  | `/rest/v1/bookings?id=eq.<uuid>` | Update booking status                      |

### Posts / Feed

| Method | Path                                   | Description |
| ------ | -------------------------------------- | ----------- |
| GET    | `/rest/v1/posts?order=created_at.desc` | Get feed    |
| POST   | `/rest/v1/posts`                       | Create post |
| DELETE | `/rest/v1/posts?id=eq.<uuid>`          | Delete post |

## Edge Functions

Custom business logic is handled by Supabase Edge Functions (Deno):

### POST `/functions/v1/create-booking`

Creates a booking with server-side validation and Stripe payment intent.

**Request body:**

```json
{
  "service_id": "uuid",
  "provider_id": "uuid",
  "booking_date": "2026-03-25",
  "booking_time": "14:00",
  "payment_method": "stripe"
}
```

**Response:**

```json
{
  "booking_id": "uuid",
  "payment_url": "https://checkout.stripe.com/..."
}
```

### POST `/functions/v1/generate-ai-preview`

Generates an AI beauty preview image.

**Request body:**

```json
{
  "session_id": "uuid",
  "style_prompt": "natural blonde balayage, soft waves",
  "original_image_url": "https://..."
}
```

**Response:**

```json
{
  "success": true,
  "result_image_url": "https://...",
  "tokens_used": 30
}
```

### POST `/functions/v1/stella-command`

Processes a Stella AI voice/text command.

**Request body:**

```json
{
  "command_text": "prenota taglio capelli per domani alle 15",
  "context": {}
}
```

### POST `/functions/v1/stripe-webhook`

Handles Stripe payment webhooks. Must be called with the raw body and `Stripe-Signature` header.

## Rate Limits

| Tier           | Requests/min |
| -------------- | ------------ |
| Anonymous      | 100          |
| Authenticated  | 1000         |
| Edge Functions | 500          |

## Error Codes

| Code       | Description                              |
| ---------- | ---------------------------------------- |
| `PGRST116` | No rows found (use `.maybeSingle()`)     |
| `23505`    | Unique constraint violation              |
| `42501`    | RLS policy violation (permission denied) |

## Required GitHub Secrets

| Secret                      | Description               |
| --------------------------- | ------------------------- |
| `VERCEL_TOKEN`              | Vercel deployment token   |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `SUPABASE_URL`              | Supabase project URL      |
| `OPENAI_API_KEY`            | OpenAI API key            |
| `STABILITY_API_KEY`         | Stability AI API key      |
| `SENTRY_DSN`                | Sentry DSN                |
| `STRIPE_SECRET`             | Stripe secret key         |

See also: `pasted.txt` in the repository root for the full canonical specification.

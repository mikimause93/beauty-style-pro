# API Documentation

Beauty Style Pro exposes its backend through **Supabase auto-generated REST API** plus custom **Edge Functions** deployed on Supabase (Deno runtime).

## Base URLs

| Environment | URL                                      |
| ----------- | ---------------------------------------- |
| Production  | `https://<your-project-ref>.supabase.co` |
| Local Dev   | `http://localhost:54321`                 |

## Authentication

All requests require a JWT in the `Authorization` header:

```
Authorization: Bearer <user-jwt>
```

Or the Supabase anon key for public endpoints:

```
apikey: <anon-key>
```

## REST API (Auto-generated)

Supabase generates a full PostgREST API from the database schema.

### Common Patterns

```
GET    /rest/v1/<table>?select=*
POST   /rest/v1/<table>
PATCH  /rest/v1/<table>?id=eq.<id>
DELETE /rest/v1/<table>?id=eq.<id>
```

### Key Endpoints

#### Profiles

```
GET  /rest/v1/profiles?id=eq.<uuid>
PATCH /rest/v1/profiles?id=eq.<uuid>
```

#### Posts (Social Feed)

```
GET  /rest/v1/posts?order=created_at.desc&limit=20
POST /rest/v1/posts
```

#### Services & Booking

```
GET  /rest/v1/services?is_active=eq.true
POST /rest/v1/bookings
GET  /rest/v1/bookings?client_id=eq.<uuid>
```

#### Shop

```
GET  /rest/v1/shop_products?is_active=eq.true
POST /rest/v1/cart_items
POST /rest/v1/shop_orders
```

## Edge Functions

Edge Functions are invoked via:

```typescript
const { data, error } = await supabase.functions.invoke('<function-name>', {
  body: {
    /* payload */
  },
});
```

### Available Functions

| Function                   | Description                           |
| -------------------------- | ------------------------------------- |
| `create-checkout`          | Create Stripe/PayPal checkout session |
| `stripe-webhook`           | Handle Stripe webhook events          |
| `check-subscription`       | Verify user subscription status       |
| `customer-portal`          | Stripe customer portal link           |
| `process-withdrawal`       | Creator payout processing             |
| `generate-ai-preview`      | DALL-E 3 beauty style preview         |
| `chatbot-assistant`        | Stella AI chat (GPT-4)                |
| `ai-beauty-assistant`      | AI beauty recommendations             |
| `ai-beauty`                | Beauty analysis                       |
| `ai-look-generator`        | Look generation                       |
| `ai-router`                | AI routing                            |
| `ai-smart-match`           | Stylist matching                      |
| `ai-translate`             | Auto-translation                      |
| `ai-automation-triggers`   | Automated actions                     |
| `ai-growth-engine`         | Growth recommendations                |
| `whatsapp-messaging`       | WhatsApp Business API                 |
| `sms-messaging`            | SMS notifications                     |
| `smart-reminders`          | Booking reminders                     |
| `stella-scheduled-actions` | Stella AI scheduled tasks             |

### `generate-ai-preview`

**Request:**

```json
{
  "prompt": "wavy balayage hair with honey tones",
  "style_type": "hair",
  "input_image_url": "https://..."
}
```

**Response:**

```json
{
  "job_id": "uuid",
  "result_image_url": "https://oaidalleapiprodscus.blob.core.windows.net/..."
}
```

**Style types:** `hair` | `makeup` | `nails` | `full_look`

### `create-checkout`

**Request:**

```json
{
  "price_id": "price_xxx",
  "mode": "subscription",
  "success_url": "https://app.example.com/success",
  "cancel_url": "https://app.example.com/cancel"
}
```

**Response:**

```json
{
  "url": "https://checkout.stripe.com/c/pay/..."
}
```

## Realtime Subscriptions

```typescript
// Subscribe to new messages in a conversation
supabase
  .channel('messages:<conversation_id>')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.<id>`,
    },
    handler
  )
  .subscribe();
```

## Rate Limits

| Endpoint       | Limit                  |
| -------------- | ---------------------- |
| Auth endpoints | 30 req/min             |
| REST API       | 1000 req/min           |
| Edge Functions | 500 req/min            |
| AI Preview     | 10 req/min (free tier) |

## Error Codes

| Code          | Description                             |
| ------------- | --------------------------------------- |
| `PGRST116`    | No rows returned (use `.maybeSingle()`) |
| `23505`       | Unique constraint violation             |
| `42501`       | RLS policy violation                    |
| `JWT expired` | Token expired — refresh session         |

## Further Reading

- [Supabase Docs](https://supabase.com/docs)
- [PostgREST API Reference](https://postgrest.org/en/stable/api.html)
- [pasted.txt](../pasted.txt) — Full canonical specification

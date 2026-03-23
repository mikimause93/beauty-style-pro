# Architecture

## Overview

Beauty Style Pro is a full-stack enterprise beauty platform built on:

- **Frontend:** React 18 + Vite 5 + TypeScript (SPA, PWA-ready)
- **Backend:** Supabase (PostgreSQL 15, Realtime, Edge Functions on Deno)
- **Mobile:** Capacitor 6 (iOS + Android native wrappers)
- **AI:** OpenAI GPT-4 + DALL-E 3 + Whisper
- **Payments:** Stripe + PayPal
- **CDN/Security:** Cloudflare

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                            │
├──────────────────┬──────────────────┬───────────────────────┤
│  Web App (React) │  iOS (Capacitor) │  Android (Capacitor)  │
│  Vercel Deploy   │  App Store       │  Play Store           │
└──────────────────┴──────────────────┴───────────────────────┘
                            │
                    (HTTPS / WSS)
                            │
┌─────────────────────────────────────────────────────────────┐
│                   API GATEWAY LAYER                         │
├─────────────────────────────────────────────────────────────┤
│        Supabase REST API (PostgREST auto-generated)         │
│        Supabase Realtime (WebSocket channels)               │
│        Custom Edge Functions (Deno runtime)                 │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                  BUSINESS LOGIC LAYER                       │
├───────────┬─────────────┬─────────────┬─────────────────────┤
│  Auth     │  Realtime   │  Storage    │  Edge Functions     │
│  (JWT)    │  Channels   │  Buckets    │  (25+ functions)    │
└───────────┴─────────────┴─────────────┴─────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                               │
├─────────────────────────────────────────────────────────────┤
│           PostgreSQL 15 (110+ tables, RLS)                  │
│           PostGIS (geolocation)                             │
│           pg_cron (scheduled jobs)                          │
│           pgvector (AI embeddings)                          │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                  EXTERNAL SERVICES                          │
├──────────┬─────────┬──────────────┬──────────┬─────────────┤
│ Stripe   │ OpenAI  │ Google Maps  │ WhatsApp │ OneSignal   │
│ PayPal   │ Whisper │ Cloudflare   │ Twilio   │ Sentry      │
└──────────┴─────────┴──────────────┴──────────┴─────────────┘
```

## Frontend Architecture

### Directory Structure

```
src/
├── components/          # Reusable UI components (200+)
│   ├── ui/              # Shadcn/Radix primitives
│   ├── layout/          # App shell (MobileLayout, BottomNav)
│   ├── chatbot/         # ChatbotWidget (Stella AI FAB)
│   ├── notifications/   # NotificationToast
│   └── ...
├── contexts/            # React contexts
│   ├── StellaContext.tsx
│   └── NotificationsContext.tsx
├── hooks/               # Custom hooks
│   └── useAuth.tsx
├── lib/                 # Utilities
│   ├── safeStorage.ts   # localStorage wrapper
│   ├── version.ts       # Central version constant
│   ├── errorCodes.ts    # Centralized error handling
│   └── supabase.ts      # Supabase client singleton
├── pages/               # Route-level components
├── test/                # Test setup + unit tests
└── main.tsx             # Entry point
```

### State Management

| Layer                | Tool                                 |
| -------------------- | ------------------------------------ |
| Server state (async) | TanStack Query v5                    |
| Global UI state      | React Context + useReducer           |
| Form state           | React Hook Form + Zod                |
| Local preferences    | `safeStorage` (localStorage wrapper) |

### Routing

```tsx
// React Router v6 — file-based routes in src/App.tsx
<Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/auth" element={<AuthPage />} />
  <Route path="/feed" element={<FeedPage />} />
  <Route path="/booking" element={<BookingPage />} />
  <Route path="/shop" element={<ShopPage />} />
  <Route path="/academy" element={<AcademyPage />} />
  <Route path="/profile/:id" element={<ProfilePage />} />
  <Route path="/ai-preview" element={<AIPreviewPage />} />
  ...
</Routes>
```

## Backend Architecture (Supabase)

### Edge Functions (Deno)

Each function in `supabase/functions/` is an independent Deno script:

```typescript
// Pattern for all edge functions
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  // 1. CORS preflight
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // 2. Auth check
  const user = await verifyJWT(req);

  // 3. Validate input
  const body = await req.json();

  // 4. Business logic
  // ...

  // 5. Return response
  return new Response(JSON.stringify(result), { headers: corsHeaders });
});
```

### Row Level Security (RLS)

Every table has RLS enabled with explicit policies. No implicit access is allowed:

```sql
-- Default: deny all (RLS is ON)
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;

-- Grant only what's needed
CREATE POLICY "policy_name" ON <table>
  FOR <operation> USING (<condition>);
```

### Realtime Subscriptions

```typescript
// Subscribe to table changes
supabase
  .channel('channel-name')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${id}`,
    },
    handler
  )
  .subscribe();
```

## AI Systems

### Stella AI (Voice Assistant)

1. Wake word detection (browser Web Speech API)
2. Voice → Text (Whisper via OpenAI)
3. NLU + action planning (GPT-4)
4. Action execution (booking, messaging, navigation)
5. Response generation (TTS with 11 voices)

### AI Preview (v4.0)

1. User uploads/takes photo
2. Frontend sends to `generate-ai-preview` edge function
3. Edge function calls DALL-E 3 with beauty prompt
4. Result stored in `ai_preview_jobs` table
5. Frontend polls/subscribes for completion
6. User can save, share, or request consultation

## Security Architecture

- **Auth:** Supabase Auth (JWT, OAuth providers)
- **RLS:** Every table, 300+ policies
- **Secrets:** Supabase Vault (Edge Function secrets)
- **CDN:** Cloudflare (WAF, DDoS protection, rate limiting)
- **Headers:** HSTS, CSP, X-Frame-Options via Vercel config
- **Payments:** Stripe (PCI DSS Level 1)
- **Data:** AES-256 at rest, TLS 1.3 in transit

## Performance

- **Code splitting:** Vite `manualChunks` by vendor (react-core, router, supabase, etc.)
- **Image optimization:** WebP, lazy loading
- **Query caching:** TanStack Query with stale-while-revalidate
- **CDN:** Cloudflare edge caching
- **Bundle size:** < 500KB initial (with lazy routes)

## Further Reading

- [docs/API.md](API.md)
- [docs/DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)
- [docs/DEPLOYMENT.md](DEPLOYMENT.md)
- [pasted.txt](../pasted.txt) — Full canonical specification

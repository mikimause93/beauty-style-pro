# Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                            │
├─────────────────────────────────────────────────────────────┤
│  Web App (React)  │  iOS App (Swift)  │  Android (Kotlin)  │
│   Vercel Deploy   │   App Store       │   Play Store       │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     API GATEWAY                             │
├─────────────────────────────────────────────────────────────┤
│              Supabase API (Auto-generated REST)             │
│              + Custom Edge Functions (Deno)                 │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  BUSINESS LOGIC LAYER                       │
├─────────────────────────────────────────────────────────────┤
│  Auth      │  Realtime   │  Storage    │  Edge Functions   │
│  Service   │  Channels   │  Buckets    │  (Serverless)     │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                               │
├─────────────────────────────────────────────────────────────┤
│           PostgreSQL 15 (110+ tables)                       │
│           + PostGIS (geolocation)                           │
│           + pg_cron (scheduled jobs)                        │
│           + pgvector (AI embeddings)                        │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  EXTERNAL SERVICES                          │
├─────────────────────────────────────────────────────────────┤
│ Stripe  │ OpenAI  │ Google Maps │ WhatsApp │ OneSignal    │
│ PayPal  │ Whisper │ Cloudflare  │ Twilio   │ Sentry       │
└─────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Tech Stack

- **React 18.3** – UI framework
- **Vite 5.0** – build tool with HMR
- **TypeScript 5.0** – type safety
- **Tailwind CSS 3.4** – utility-first styling
- **Framer Motion** – animations
- **TanStack Query** – server state management
- **React Hook Form + Zod** – form validation
- **React Router 6** – client-side routing

### Directory Structure

```
src/
├── components/       # Reusable UI components (200+)
│   ├── layout/       # MobileLayout, Header, BottomNav
│   ├── chatbot/      # ChatbotWidget (Stella AI)
│   ├── notifications/ # NotificationToast
│   └── ui/           # shadcn/ui primitives
├── contexts/         # React contexts (Auth, Stella, Notifications)
├── hooks/            # Custom hooks (useAuth, useTheme, etc.)
├── lib/              # Utilities (supabase, safeStorage, errorCodes, version)
├── pages/            # Route pages (100+)
└── test/             # Test setup + unit tests
```

### State Management

- **TanStack Query** – server state (caching, revalidation)
- **React Context** – global UI state (auth, theme, notifications)
- **React Hook Form** – form state
- **Supabase Realtime** – live data synchronization

## Backend Architecture

### Supabase Services

- **Auth** – JWT-based with email/OTP/OAuth
- **Database** – PostgreSQL 15 with RLS
- **Storage** – File storage (images, videos, documents)
- **Realtime** – WebSocket channels for live updates
- **Edge Functions** – Deno serverless functions

### Edge Functions (25+)

| Function                   | Description                                 |
| -------------------------- | ------------------------------------------- |
| `create-booking`           | Server-side booking creation + Stripe       |
| `generate-ai-preview`      | AI beauty preview (Stability AI / DALL-E 3) |
| `stella-scheduled-actions` | Stella AI scheduled task runner             |
| `stripe-webhook`           | Payment event processing                    |
| `ai-router`                | Routes AI requests to appropriate models    |
| `chatbot-assistant`        | Stella conversational AI                    |
| `smart-reminders`          | Booking reminder notifications              |
| `whatsapp-messaging`       | WhatsApp Business API integration           |

## Mobile Architecture

### Capacitor 6.x

- **Web → Native bridge** for iOS and Android
- Shared React codebase with native plugins
- Native plugins: Camera, Geolocation, Push, Biometrics, NFC

### Native Features

- **Deep linking**: Universal Links (iOS) + App Links (Android)
- **Offline support**: TanStack Query persistence adapter
- **Push notifications**: Firebase Cloud Messaging (FCM)

## Security Architecture

- **RLS** – 300+ PostgreSQL Row Level Security policies
- **JWT** – Stateless authentication
- **TLS 1.3** – All traffic encrypted in transit
- **AES-256** – Data encrypted at rest
- **Cloudflare** – DDoS mitigation + CDN

See [SECURITY.md](../SECURITY.md) for the full security policy.

## Scalability

- **Horizontal scaling**: Supabase auto-scales the database
- **Edge Functions**: Deployed globally on Deno Deploy
- **CDN**: Cloudflare distributes static assets globally
- **Media**: Supabase Storage + Cloudflare R2 for large files

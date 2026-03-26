# Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                            │
├─────────────────────────────────────────────────────────────┤
│  Web App (React)  │  iOS App (Capacitor) │  Android App    │
│   Vercel CDN      │   App Store          │   Play Store    │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS / WSS
┌───────────────────────────▼─────────────────────────────────┐
│                     API GATEWAY                             │
├─────────────────────────────────────────────────────────────┤
│         Supabase PostgREST (auto-generated REST)            │
│         + Supabase Realtime (WebSocket channels)            │
│         + Custom Edge Functions (Deno, serverless)          │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                  BUSINESS LOGIC LAYER                       │
├─────────────────────────────────────────────────────────────┤
│  Auth Service  │  Realtime Channels  │  Storage Buckets    │
│  (Supabase)    │  (Supabase)         │  (Supabase + R2)    │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    DATA LAYER                               │
├─────────────────────────────────────────────────────────────┤
│           PostgreSQL 15 (110+ tables, RLS)                  │
│           + PostGIS (geolocation)                           │
│           + pg_cron (scheduled jobs)                        │
│           + pgvector (AI embeddings)                        │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                  EXTERNAL SERVICES                          │
├─────────────────────────────────────────────────────────────┤
│ Stripe/PayPal │ OpenAI  │ Google Maps │ WhatsApp │ Sentry  │
│ OneSignal/FCM │ Whisper │ Cloudflare  │ Twilio   │ PostHog │
└─────────────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

### Tech Stack

| Layer      | Technology                        |
| ---------- | --------------------------------- |
| Framework  | React 18.3 + TypeScript 5.0       |
| Build tool | Vite 5.0                          |
| Styling    | Tailwind CSS 3.4 + Framer Motion  |
| State      | TanStack Query v5 + React Context |
| Routing    | React Router v6                   |
| Forms      | React Hook Form + Zod             |
| UI         | Radix UI + shadcn/ui              |
| Mobile     | Capacitor 6.x (iOS/Android)       |

### Directory Structure

```
src/
├── App.tsx                 # Root component, routing
├── components/             # Reusable UI components
│   ├── layout/             # MobileLayout, BottomNav, Header
│   ├── chatbot/            # ChatbotWidget (Stella AI)
│   ├── notifications/      # NotificationToast
│   └── ui/                 # shadcn/ui primitives
├── contexts/               # React Context providers
│   ├── NotificationsContext.tsx
│   └── StellaContext.tsx
├── hooks/                  # Custom React hooks
│   ├── useAuth.tsx         # Authentication hook
│   └── useTheme.ts         # Dark/light theme
├── integrations/
│   └── supabase/           # Supabase client + type definitions
├── lib/                    # Shared utilities
│   ├── errorCodes.ts       # Localized error messages
│   ├── safeStorage.ts      # localStorage with fallback
│   └── version.ts          # App version constant
├── pages/                  # Route-level page components
└── test/                   # Unit tests + setup
```

---

## Backend Architecture (Supabase)

### Authentication

- Email/password + OAuth (Google, Apple)
- Phone OTP (WhatsApp-style)
- JWT tokens stored in localStorage via Supabase client
- Row Level Security enforces per-user data access

### Database

- PostgreSQL 15 with 110+ tables
- All tables have RLS enabled
- pgvector for AI embedding search
- PostGIS for geolocation radius queries
- pg_cron for scheduled reminders and cleanup jobs

### Edge Functions (Deno)

25+ serverless functions handle:

- Payment processing (Stripe/PayPal)
- AI inference (OpenAI GPT-4/Whisper)
- Push notifications (OneSignal/FCM)
- WhatsApp messaging
- PDF certificate generation
- Media moderation

### Storage

| Bucket          | Purpose                    | Access        |
| --------------- | -------------------------- | ------------- |
| `avatars`       | User profile pictures      | Authenticated |
| `post-media`    | Social post images/videos  | Public        |
| `messages`      | Chat attachments           | Authenticated |
| `shop-products` | Marketplace product images | Public        |
| `courses`       | Academy video content      | Enrolled only |
| `documents`     | Certificates, invoices     | Owner only    |

---

## CI/CD Pipeline

```
Push/PR → GitHub Actions
  └─ ci.yml:
      ├─ Lint (ESLint)
      ├─ Unit Tests (Vitest + coverage)
      └─ E2E Tests (Playwright, Chromium)

Push to main / tag → deploy.yml:
  ├─ Build (Vite)
  ├─ Deploy Frontend → Vercel
  ├─ Deploy Edge Functions → Supabase
  └─ Create GitHub Release (semantic-release)

Weekly → security-scan.yml:
  └─ npm audit + Dependabot
```

---

## Security Model

- **RLS**: Every table has Row Level Security policies
- **JWT**: Supabase manages token lifecycle with auto-refresh
- **Secrets**: All API keys in GitHub Secrets / Supabase Vault
- **CORS**: Supabase restricts origins to allowlisted domains
- **Cloudflare**: DDoS protection, rate limiting, WAF

# Deployment Guide

## Overview

Beauty Style Pro uses a split deployment model:

- **Frontend:** Vercel (React/Vite SPA)
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **CDN:** Cloudflare (assets + DDoS protection)

## Prerequisites

| Tool         | Min Version |
| ------------ | ----------- |
| Node.js      | 18.x        |
| npm          | 9.x         |
| Supabase CLI | 1.180.0     |
| Vercel CLI   | 34.x        |
| Git          | 2.40.0      |

## Environment Variables

Copy `.env.example` to `.env.local` and fill in all values:

```bash
cp .env.example .env.local
```

| Variable                        | Required | Description                           |
| ------------------------------- | -------- | ------------------------------------- |
| `VITE_SUPABASE_URL`             | ✅       | Supabase project URL                  |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ✅       | Supabase anon/publishable key         |
| `VITE_SUPABASE_PROJECT_ID`      | ✅       | Supabase project ref                  |
| `STRIPE_SECRET_KEY`             | ✅       | Stripe secret key (server-side only)  |
| `STRIPE_WEBHOOK_SECRET`         | ✅       | Stripe webhook signing secret         |
| `SUPABASE_SERVICE_ROLE_KEY`     | ✅       | For Edge Functions (server-side only) |
| `OPENAI_API_KEY`                | ✅       | OpenAI (Stella AI + AI Preview)       |
| `SENTRY_DSN`                    | ⬜       | Error monitoring                      |
| `STABILITY_API_KEY`             | ⬜       | Stability AI (optional)               |

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start Supabase local stack
supabase start

# 3. Apply migrations
supabase db push

# 4. Start dev server
npm run dev
# → http://localhost:5173
```

## Database Migrations

```bash
# Apply all pending migrations
supabase db push

# Create a new migration
supabase migration new <migration_name>

# Reset local database (⚠️ destructive!)
supabase db reset

# See migration status
supabase migration list
```

## Deploying Edge Functions

```bash
# Deploy all functions
supabase functions deploy

# Deploy single function
supabase functions deploy generate-ai-preview

# Set secrets for functions
supabase secrets set OPENAI_API_KEY=sk-xxx
supabase secrets set STRIPE_SECRET_KEY=sk_live_xxx
```

## Frontend Deployment (Vercel)

### First-time setup

```bash
npm install -g vercel
vercel login
vercel link   # Link to existing or create new project
```

### Manual deploy

```bash
npm run build
vercel --prod
```

### CI/CD (automated)

The `.github/workflows/deploy.yml` workflow deploys automatically on push to `main`.

Required GitHub Secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

### Vercel Environment Variables

Set these in the Vercel dashboard under **Settings → Environment Variables**:

```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
VITE_SUPABASE_PROJECT_ID=xxx
```

## Production Checklist

- [ ] All environment variables set in Vercel + Supabase Vault
- [ ] Database migrations applied (`supabase db push --linked`)
- [ ] Edge Functions deployed (`supabase functions deploy`)
- [ ] Edge Function secrets set (`supabase secrets set`)
- [ ] Stripe webhook endpoint configured
- [ ] Sentry DSN configured
- [ ] Cloudflare proxying enabled for custom domain
- [ ] SSL certificate active
- [ ] GitHub Secrets configured for CI/CD workflows

## Rollback

```bash
# Revert to previous Vercel deployment
vercel rollback

# Revert last database migration (if reversible)
supabase db reset  # ⚠️ Only on dev/staging!
```

## Monitoring

- **Errors:** Sentry (`SENTRY_DSN`)
- **Analytics:** PostHog + Google Analytics 4
- **Database:** Supabase Dashboard → Database → Logs
- **Edge Functions:** Supabase Dashboard → Edge Functions → Logs
- **Uptime:** Vercel Dashboard

## Required GitHub Secrets for CI/CD

| Secret                          | Description                  |
| ------------------------------- | ---------------------------- |
| `VERCEL_TOKEN`                  | Vercel personal access token |
| `VERCEL_ORG_ID`                 | Vercel organization/team ID  |
| `VERCEL_PROJECT_ID`             | Vercel project ID            |
| `VITE_SUPABASE_URL`             | Supabase project URL         |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key            |
| `VITE_SUPABASE_PROJECT_ID`      | Supabase project ref         |
| `SUPABASE_ACCESS_TOKEN`         | Supabase CLI access token    |
| `SUPABASE_DB_PASSWORD`          | Supabase database password   |
| `OPENAI_API_KEY`                | OpenAI API key               |
| `STRIPE_SECRET`                 | Stripe secret key            |
| `SENTRY_DSN`                    | Sentry DSN                   |

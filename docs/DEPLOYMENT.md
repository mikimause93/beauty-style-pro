# Deployment Guide

## Prerequisites

- Node.js >= 18
- npm >= 9
- [Vercel CLI](https://vercel.com/docs/cli): `npm i -g vercel`
- [Supabase CLI](https://supabase.com/docs/guides/cli): `npm i -g supabase`
- GitHub repository with secrets configured (see below)

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in all values before deploying.

### Required Secrets (GitHub Actions)

Set these in **GitHub → Settings → Secrets and Variables → Actions**:

| Secret                          | Description                        |
| ------------------------------- | ---------------------------------- |
| `VITE_SUPABASE_URL`             | Your Supabase project URL          |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key                  |
| `VITE_SUPABASE_PROJECT_ID`      | Supabase project reference ID      |
| `SUPABASE_ACCESS_TOKEN`         | Supabase CLI access token          |
| `VERCEL_TOKEN`                  | Vercel personal access token       |
| `VERCEL_ORG_ID`                 | Vercel organization ID             |
| `VERCEL_PROJECT_ID`             | Vercel project ID                  |
| `STRIPE_SECRET_KEY`             | Stripe secret key (Edge Functions) |
| `STRIPE_WEBHOOK_SECRET`         | Stripe webhook signing secret      |

---

## Deploying to Vercel

### Manual Deploy

```bash
# Build the project
npm run build

# Deploy to Vercel
vercel --prod
```

### Automated Deploy (CI/CD)

The `deploy.yml` workflow automatically deploys to Vercel on push to `main`.

To set up:

1. Install the Vercel GitHub Integration or use the `amondnet/vercel-action`.
2. Add `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` as GitHub secrets.
3. Push to `main` to trigger deployment.

### Vercel Project Settings

```json
// vercel.json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## Deploying Supabase

### Database Migrations

```bash
# Pull remote schema
supabase db pull

# Apply local migrations to remote
supabase db push

# Reset local database (dev only)
supabase db reset
```

### Edge Functions

```bash
# Deploy all Edge Functions
supabase functions deploy

# Deploy a single function
supabase functions deploy create-booking --project-ref <your-project-ref>
```

### Setting Supabase Secrets

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set OPENAI_API_KEY=sk-...
```

---

## Release Process

1. Merge all changes into `main`.
2. Create and push a semver tag:
   ```bash
   git tag v3.1.0
   git push origin v3.1.0
   ```
3. The `deploy.yml` workflow detects the tag, runs tests, builds, deploys to Vercel, and creates a GitHub Release automatically via semantic-release.

---

## Health Checks

After deployment, verify:

- [ ] Frontend loads at your Vercel URL
- [ ] Supabase connection works (check browser network tab)
- [ ] Auth flows (sign up, sign in, OTP) work
- [ ] Stripe webhook endpoint receives test events
- [ ] Edge Functions respond correctly (`supabase functions invoke <name>`)

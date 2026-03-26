# Troubleshooting

## Common Issues

---

### `npm install` fails or takes forever

**Cause:** Corrupted `node_modules` or stale lock file.

**Fix:**

```bash
rm -rf node_modules package-lock.json
npm install
```

---

### Supabase connection errors (`Failed to fetch`)

**Cause:** Missing or incorrect `.env.local` variables.

**Fix:**

1. Ensure `.env.local` exists and contains `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
2. Restart the dev server (`npm run dev`).
3. Verify your project is active at https://supabase.com/dashboard.

---

### `PGRST116` error (no rows returned by .single())

**Cause:** Using `.single()` on a query that returns 0 rows.

**Fix:** Replace `.single()` with `.maybeSingle()` in all queries where the record may not exist.

```typescript
// ❌ Wrong
const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();

// ✅ Correct
const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
```

---

### Vite build fails with TypeScript errors

**Cause:** Type errors in source files.

**Fix:**

```bash
# Check types without building
npx tsc --noEmit

# View all type errors
npx tsc --noEmit 2>&1 | head -50
```

---

### `supabase start` fails (port already in use)

**Fix:**

```bash
# Stop existing containers
supabase stop

# Or force stop
docker ps | grep supabase | awk '{print $1}' | xargs docker stop

# Restart
supabase start
```

---

### Stripe webhook not receiving events locally

**Fix:** Use the Stripe CLI to forward events:

```bash
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook
```

---

### `npm run lint` reports errors

**Fix:**

```bash
# Auto-fix fixable issues
npm run lint -- --fix

# Also format code
npm run format
```

---

### Tests fail with `localStorage is not defined`

**Cause:** The test environment doesn't mock `localStorage`.

**Fix:** The `src/test/setup.ts` file includes a `matchMedia` mock. For `localStorage`, use the `safeStorage` utility (`src/lib/safeStorage.ts`) in your code, which gracefully falls back to in-memory storage in test environments.

---

### Playwright E2E tests time out

**Cause:** The dev server is not running, or the app takes too long to load.

**Fix:**

1. Ensure `webServer` is configured in `playwright.config.ts` to start `npm run dev` automatically.
2. Increase the `timeout` in `playwright.config.ts` for slow CI environments.
3. Run E2E tests locally first: `npm run e2e`.

---

### Android build fails (`gradlew bundleRelease`)

**Cause:** Missing keystore or wrong Java version.

**Fix:**

1. Ensure `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEY_ALIAS`, `ANDROID_STORE_PASSWORD`, and `ANDROID_KEY_PASSWORD` are set as GitHub secrets.
2. Verify Java 17 is installed: `java -version`.
3. Sync Capacitor: `npx cap sync android`.

---

## Useful Commands

```bash
# Check Node / npm versions
node --version && npm --version

# Check Supabase status
supabase status

# View Supabase logs
supabase db logs

# Run database migrations locally
supabase db reset

# Deploy Edge Functions
supabase functions deploy

# View deployed function logs
supabase functions logs <function-name>

# Run all CI checks locally
npm run lint && npm run test && npm run build
```

---

## Getting More Help

- [Supabase Docs](https://supabase.com/docs)
- [Vite Docs](https://vitejs.dev/)
- [Vitest Docs](https://vitest.dev/)
- [Playwright Docs](https://playwright.dev/)
- Open a [GitHub Issue](../../issues/new/choose)

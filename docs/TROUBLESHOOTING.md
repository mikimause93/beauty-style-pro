# Troubleshooting

Common issues and their solutions for Beauty Style Pro.

---

## Build Failures

### `vite build` fails with environment variable errors

**Symptoms:** Build exits with `VITE_SUPABASE_URL is not defined`

**Solution:** Ensure `.env.local` exists and has all required variables:

```bash
cp .env.example .env.local
# Fill in all values
```

For CI, make sure GitHub Secrets are set (see [DEPLOYMENT.md](DEPLOYMENT.md)).

---

### TypeScript errors on `npm run build`

**Symptoms:** `TS2345: Argument of type X is not assignable to type Y`

**Solution:**

1. Run `npm install` to ensure types are up-to-date.
2. Check if the error is in generated Supabase types — run `supabase gen types typescript --local > src/integrations/supabase/types.ts`.
3. If it's a `no-explicit-any` warning (not error), it's expected — the build still succeeds.

---

## Database / Supabase Issues

### `PGRST116: JSON object requested, multiple (or no) rows returned`

**Symptoms:** Error thrown by `.single()` when query returns 0 rows.

**Solution:** Replace `.single()` with `.maybeSingle()` which returns `null` instead of throwing:

```typescript
// ❌ Throws when 0 rows
const { data } = await supabase.from('profiles').select().eq('id', id).single();

// ✅ Returns null when 0 rows
const { data } = await supabase.from('profiles').select().eq('id', id).maybeSingle();
```

---

### RLS Policy Violations (`42501`)

**Symptoms:** `new row violates row-level security policy for table "X"`

**Solution:**

1. Check that the user is authenticated (`auth.uid()` is not null).
2. Verify the relevant RLS policy exists for the operation.
3. In Supabase Dashboard → Authentication → Policies, inspect the table.

---

### Supabase local instance not starting

**Symptoms:** `supabase start` hangs or fails.

**Solution:**

```bash
# Check Docker is running
docker info

# Reset Supabase local state
supabase stop --no-backup
supabase start

# Check logs
supabase logs
```

---

### Migration fails with "already exists"

**Symptoms:** `ERROR: relation "X" already exists`

**Solution:** Use `IF NOT EXISTS` in migrations:

```sql
CREATE TABLE IF NOT EXISTS my_table (...);
CREATE INDEX IF NOT EXISTS idx_name ON my_table(col);
```

---

## Authentication Issues

### User redirected to login after refresh

**Symptoms:** Session lost on page refresh.

**Solution:** Ensure `supabase.auth.onAuthStateChange` is called at app root and session is persisted. Check `safeStorage` — if `localStorage` is blocked (e.g. Safari ITP), the in-memory fallback is used and session won't persist across tabs.

---

### "Auth session missing" error in Edge Functions

**Symptoms:** Edge function returns 401.

**Solution:** Pass the user JWT in the Authorization header:

```typescript
const { data: { session } } = await supabase.auth.getSession();
const { data, error } = await supabase.functions.invoke('my-function', {
  body: { ... },
  headers: { Authorization: `Bearer ${session?.access_token}` }
});
```

---

## Payment Issues

### Stripe webhook not received

**Symptoms:** Orders not updating after payment.

**Solution:**

1. Verify the webhook endpoint is configured in Stripe Dashboard.
2. Check `STRIPE_WEBHOOK_SECRET` is set in Supabase Vault:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
   ```
3. Check Edge Function logs: Supabase Dashboard → Functions → `stripe-webhook` → Logs.

---

## AI Features

### AI Preview returns generic image

**Symptoms:** DALL-E 3 result doesn't match the prompt well.

**Solution:** Improve the prompt specificity. DALL-E 3 works better with detailed descriptions:

```
❌ "blonde hair"
✅ "photorealistic studio portrait of a woman with shoulder-length balayage blonde hair, warm honey highlights, loose waves, professional beauty salon lighting"
```

---

### Stella AI not responding

**Symptoms:** Voice commands not processed.

**Solution:**

1. Check microphone permissions in browser.
2. Verify `OPENAI_API_KEY` is set in Supabase Vault.
3. Check the `chatbot-assistant` edge function logs.
4. Ensure the user has an active Stella subscription (free tier: 10 commands/day).

---

## Mobile Build Issues

### `cap sync` fails

**Symptoms:** Capacitor sync fails with Android/iOS errors.

**Solution:**

```bash
# Rebuild web assets first
npm run build

# Then sync
npx cap sync

# If iOS CocoaPods issue:
cd ios/App && pod install
```

---

### Android build fails in CI

**Symptoms:** Android Studio build fails with Gradle errors.

**Solution:**

1. Ensure `android/local.properties` has the correct `sdk.dir`.
2. Check `android/app/src/main/assets/public/` is populated (run `npm run build && npx cap sync android` first).

---

## Test Failures

### Vitest fails with "Cannot find module" errors

**Symptoms:** Unit tests fail on import.

**Solution:**

1. Check `vitest.config.ts` has the correct `resolve.alias` for `@`.
2. Run `npm install` to ensure all devDependencies are installed.

---

### Playwright tests fail with "Target page, context or browser has been closed"

**Symptoms:** E2E tests fail intermittently.

**Solution:**

1. Ensure the dev server is running before E2E tests.
2. Check `playwright.config.ts` has `webServer` configured to wait for the server.
3. Increase `timeout` in `playwright.config.ts` if tests are slow.

---

## Getting More Help

- **Docs:** [docs/](./README.md)
- **Issues:** [GitHub Issues](https://github.com/mikimause93/beauty-style-pro/issues)
- **Discussions:** [GitHub Discussions](https://github.com/mikimause93/beauty-style-pro/discussions)
- **Supabase Support:** [supabase.com/support](https://supabase.com/support)

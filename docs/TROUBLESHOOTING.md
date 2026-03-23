# Troubleshooting Guide

## Common Issues

### Authentication

#### `PGRST116: JSON object requested, multiple (or no) rows returned`

**Cause**: Using `.single()` when 0 rows may be returned.

**Fix**: Replace `.single()` with `.maybeSingle()`:

```typescript
// ❌ Wrong
const { data } = await supabase.from("profiles").select("*").eq("id", id).single();

// ✅ Correct
const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
```

#### JWT expired or invalid

**Fix**: Call `supabase.auth.refreshSession()` or sign out and back in.

#### RLS policy violation (42501)

**Cause**: The authenticated user doesn't have permission.

**Fix**: Check that:

1. The user is authenticated (`auth.uid()` is not null)
2. The RLS policy matches the operation (SELECT/INSERT/UPDATE/DELETE)

---

### Build Errors

#### `Cannot find module '@/...'`

**Fix**: Check that `tsconfig.json` has the `@` path alias:

```json
{
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
  }
}
```

And `vite.config.ts` has:

```typescript
resolve: {
  alias: { "@": path.resolve(__dirname, "./src") }
}
```

#### Vite build fails on type errors

**Fix**: Run `npm run lint` to find TypeScript errors first.

---

### Supabase Local

#### `supabase start` fails

**Fix**:

1. Ensure Docker is running.
2. `supabase stop --no-backup && supabase start`

#### Migrations fail to apply

**Fix**:

```bash
supabase db reset   # resets local DB and re-applies all migrations
```

---

### Tests

#### Tests fail with `vitest: not found`

**Fix**: `npm install` to install devDependencies.

#### Tests fail with `localStorage is not defined`

**Cause**: Using `localStorage` directly in test environment (jsdom).

**Fix**: Use `safeStorage` from `src/lib/safeStorage.ts` which gracefully falls back.

#### Playwright E2E tests fail to start

**Fix**:

```bash
npx playwright install --with-deps chromium
npm run build  # build the app first
npm run e2e
```

---

### Mobile (Capacitor)

#### iOS build fails with code signing error

**Fix**: Open Xcode, select your team in Signing & Capabilities.

#### Android build fails with SDK error

**Fix**: Accept Android SDK licenses:

```bash
yes | sdkmanager --licenses
```

#### Push notifications not received on Android

**Fix**: Ensure `google-services.json` is present in `android/app/`.

---

### Performance

#### Slow initial load

**Fix**:

1. Check network tab for large bundles.
2. Verify Vite `manualChunks` is splitting vendor code.
3. Enable CDN caching on Vercel/Cloudflare.

#### Database queries slow

**Fix**:

1. Add indexes for frequently queried columns.
2. Use `.select("column1, column2")` instead of `.select("*")`.
3. Check Supabase Dashboard → Database → Query Performance.

---

## Getting Help

1. Check existing [GitHub Issues](https://github.com/mikimause93/beauty-style-pro/issues)
2. Read [docs/](./README.md) documentation
3. Open a [question issue](.github/ISSUE_TEMPLATE/question.md)

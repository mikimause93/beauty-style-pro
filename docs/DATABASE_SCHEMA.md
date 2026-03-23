# Database Schema

Beauty Style Pro uses **PostgreSQL 15** via Supabase with **110+ tables**, **PostGIS** for geolocation, **pgvector** for AI embeddings, and **pg_cron** for scheduled jobs.

## Migration Files

All migrations live in `supabase/migrations/`. They are applied in chronological order.

The canonical schema reference is in [pasted.txt](../pasted.txt).

## Schema Overview

### Core / Auth (20 tables)

| Table                 | Description                                     |
| --------------------- | ----------------------------------------------- |
| `profiles`            | Extended user profiles (linked to `auth.users`) |
| `posts`               | Social feed posts                               |
| `likes`               | Post likes                                      |
| `comments`            | Post comments                                   |
| `follows`             | User follow relationships                       |
| `stories`             | 24h expiring stories                            |
| `live_streams`        | Live streaming sessions                         |
| `conversations`       | 1:1 chat conversations                          |
| `messages`            | Chat messages                                   |
| `message_attachments` | File attachments in messages                    |
| `message_reactions`   | Emoji reactions                                 |
| `message_receipts`    | Delivery/read receipts                          |
| `blocked_users`       | Block relationships                             |
| `services`            | Beauty services offered by professionals        |
| `bookings`            | Service bookings                                |
| `reviews`             | Booking reviews                                 |
| `notifications`       | In-app notifications                            |

### Shop Marketplace (15 tables)

| Table               | Description                     |
| ------------------- | ------------------------------- |
| `shop_products`     | Product listings                |
| `shop_orders`       | Orders                          |
| `cart_items`        | Shopping cart                   |
| `shop_reviews`      | Product reviews                 |
| `shop_transactions` | Seller transactions (net/gross) |
| `shop_disputes`     | Dispute resolution              |
| `shop_refunds`      | Refund records                  |
| `seller_shops`      | Seller shop profiles            |
| `shipping_profiles` | Seller shipping configurations  |
| `shipping_rates`    | Country/zone rates              |
| `platform_fees`     | Commission rules                |
| `seller_tiers`      | Basic/Verified/Premium/VIP      |

### Academy LMS (10 tables)

| Table              | Description                     |
| ------------------ | ------------------------------- |
| `courses`          | Course definitions              |
| `lessons`          | Individual lessons              |
| `enrollments`      | Student enrollments + progress  |
| `certificates`     | Auto-generated PDF certificates |
| `course_materials` | Downloadable materials          |
| `course_reviews`   | Course ratings                  |
| `course_analytics` | Watch time + completion         |
| `job_postings`     | Job board                       |
| `job_applications` | Applications                    |

### AI Systems (13 tables)

| Table                      | Description                            |
| -------------------------- | -------------------------------------- |
| `stella_commands`          | Voice command history                  |
| `stella_scheduled_actions` | Scheduled AI tasks                     |
| `stella_settings`          | Per-user AI settings                   |
| `stella_action_log`        | AI action audit                        |
| `ai_chat_history`          | Chat with Stella                       |
| `ai_suggestions`           | Proactive suggestions                  |
| `ai_usage_tracking`        | Token/usage tracking                   |
| `ai_preview_jobs`          | AI Preview job queue (NEW v4.0)        |
| `ai_preview_looks`         | Saved looks from AI Preview (NEW v4.0) |
| `ai_preview_usage`         | Monthly usage quotas (NEW v4.0)        |

### AI Preview Tables (v4.0) — Full SQL

See `supabase/migrations/005_ai_preview.sql` for the complete migration.

```sql
CREATE TABLE IF NOT EXISTS ai_preview_jobs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','processing','completed','failed')),
  input_image_url  TEXT,
  prompt           TEXT NOT NULL,
  style_type       TEXT NOT NULL DEFAULT 'hair'
                     CHECK (style_type IN ('hair','makeup','nails','full_look')),
  result_image_url TEXT,
  error_message    TEXT,
  tokens_used      INTEGER DEFAULT 0,
  model_used       TEXT DEFAULT 'dall-e-3',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_preview_looks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id      UUID NOT NULL REFERENCES ai_preview_jobs(id) ON DELETE CASCADE,
  title       TEXT,
  description TEXT,
  is_public   BOOLEAN DEFAULT FALSE,
  likes_count INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_preview_usage (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_year    TEXT NOT NULL,
  previews_used INTEGER DEFAULT 0,
  tokens_used   INTEGER DEFAULT 0,
  UNIQUE (user_id, month_year)
);
```

### Security & Compliance (10 tables)

| Table                    | Description            |
| ------------------------ | ---------------------- |
| `user_consents`          | GDPR consent records   |
| `data_export_requests`   | GDPR data export       |
| `data_deletion_requests` | Right to be forgotten  |
| `audit_logs`             | Full audit trail       |
| `security_logs`          | Login/security events  |
| `fraud_checks`           | Order fraud scores     |
| `rate_limits`            | Per-user rate limiting |
| `payment_logs`           | Payment events         |

## Row Level Security (RLS)

All tables have RLS enabled. Key policy patterns:

```sql
-- Users can only see/modify their own data
CREATE POLICY "owner_policy" ON <table>
  FOR ALL USING (auth.uid() = user_id);

-- Public content readable by all
CREATE POLICY "public_read" ON <table>
  FOR SELECT USING (is_public = TRUE);

-- Authenticated users can read all public profiles
CREATE POLICY "profiles_read" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');
```

## Extensions

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS vector;  -- pgvector for AI embeddings
```

## Further Reading

- [pasted.txt](../pasted.txt) — Full canonical spec with all 110+ tables
- [supabase/migrations/](../supabase/migrations/) — All migration files
- [Supabase Docs](https://supabase.com/docs/guides/database)

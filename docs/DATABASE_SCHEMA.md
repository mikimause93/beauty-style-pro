# Database Schema

Beauty Style Pro uses PostgreSQL 15 via Supabase with 110+ tables.

## Overview

The full SQL schema is distributed across `supabase/migrations/` and the canonical spec
is in `pasted.txt` at the repository root.

## Schema Groups

### Core (20 tables)

- `profiles` – user profiles linked to `auth.users`
- `posts`, `likes`, `comments`, `follows`, `stories`, `live_streams` – social network
- `conversations`, `messages`, `message_attachments`, `message_reactions`, `message_receipts`, `blocked_users` – messaging
- `services`, `bookings`, `reviews` – service booking
- `notifications` – in-app notifications

### Shop Marketplace (15 tables)

- `shop_products`, `shop_orders`, `cart_items`, `shop_reviews`, `shop_transactions`
- `shop_disputes`, `shop_refunds`, `seller_shops`, `shipping_profiles`, `shipping_rates`
- `platform_fees`, `seller_tiers`

### Academy LMS (10 tables)

- `courses`, `lessons`, `enrollments`, `certificates`, `course_materials`
- `course_reviews`, `course_analytics`, `job_postings`, `job_applications`

### Creator Economy (12 tables)

- `creator_profiles`, `creator_earnings`, `creator_payouts`, `creator_memberships`
- `user_subscriptions`, `tips`, `brand_partnerships`, `creator_analytics`

### Stella AI System (10 tables)

- `stella_commands`, `stella_scheduled_actions`, `stella_settings`, `stella_action_log`
- `ai_chat_history`, `ai_suggestions`, `ai_usage_tracking`

### Voice & Video (8 tables)

- `call_sessions`, `call_participants`, `call_logs`, `webrtc_tokens`, `voice_messages`

### Geolocation (8 tables)

- `user_locations`, `location_permissions`, `location_shares`, `location_logs`
- `geofences`, `geofence_triggers`

### Push Notifications (7 tables)

- `device_tokens`, `push_subscriptions`, `push_notifications`, `push_notification_logs`
- `notification_templates`, `web_push_subscriptions`

### Media Storage (5 tables)

- `media_files`, `media_ownership`, `media_reports`, `media_processing_jobs`, `storage_quotas`

### Security & Compliance (10 tables)

- `user_consents`, `data_export_requests`, `data_deletion_requests`, `audit_logs`
- `security_logs`, `fraud_checks`, `rate_limits`, `payment_logs`

### Gamification (10 tables)

- `transactions`, `missions`, `user_missions`, `spin_history`, `leaderboard`

### AI Preview (4 tables) — v4.0

- `ai_preview_sessions`, `ai_preview_styles`, `ai_preview_favorites`, `ai_preview_usage`
- See migration: `supabase/migrations/005_ai_preview.sql`

### Admin & Moderation (5 tables)

- `admin_roles`, `moderation_queue`, `feature_flags`, `system_settings`

## Row Level Security (RLS)

All tables have RLS enabled with 300+ policies. Key patterns:

```sql
-- Users can only access their own data
CREATE POLICY "Users can manage own data"
  ON public.table_name FOR ALL USING (auth.uid() = user_id);

-- Public read access
CREATE POLICY "Public read"
  ON public.table_name FOR SELECT USING (true);

-- Admin full access
CREATE POLICY "Admins have full access"
  ON public.table_name FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid())
  );
```

## Extensions

- `postgis` – geolocation radius queries
- `pg_cron` – scheduled jobs (booking reminders, expiry cleanup)
- `pgvector` – AI embedding similarity search
- `uuid-ossp` – UUID generation

## Migrations

Migrations are in `supabase/migrations/` with timestamp-based filenames.
Apply with:

```bash
supabase db push --linked
```

For the full SQL schema, refer to `pasted.txt` in the repository root.

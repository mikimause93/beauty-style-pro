# Database Schema

## Overview

Beauty Style Pro uses **PostgreSQL 15** via Supabase with **110+ tables** across multiple functional domains.

All tables have **Row Level Security (RLS)** enabled with 300+ policies to ensure data isolation between users.

---

## Viewing the Schema

### Option 1 – Supabase Studio

Navigate to your project dashboard → **Table Editor** or **Database → Tables** for a visual overview.

### Option 2 – Pull Schema Locally

```bash
supabase link --project-ref <your-project-ref>
supabase db pull
```

This generates migration files in `supabase/migrations/` that represent the full schema.

### Option 3 – pgAdmin / DBeaver

Connect directly to the database using the credentials from `supabase status` (local) or the project dashboard (remote, requires disabling SSL verification for local).

---

## Domain Overview

| Domain                | Key Tables                                                                                                                                                                                                 | Count |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| Auth / Profiles       | `profiles`, `auth.users`                                                                                                                                                                                   | 2     |
| Social                | `posts`, `likes`, `comments`, `follows`, `stories`, `live_streams`                                                                                                                                         | 6     |
| Messaging             | `conversations`, `messages`, `message_attachments`, `message_reactions`, `message_receipts`, `blocked_users`                                                                                               | 6     |
| Services & Booking    | `services`, `bookings`, `reviews`, `notifications`                                                                                                                                                         | 4     |
| Shop Marketplace      | `shop_products`, `shop_orders`, `cart_items`, `shop_reviews`, `shop_transactions`, `shop_disputes`, `shop_refunds`, `seller_shops`, `shipping_profiles`, `shipping_rates`, `platform_fees`, `seller_tiers` | 12    |
| Academy LMS           | `courses`, `lessons`, `enrollments`, `certificates`, `course_materials`, `course_reviews`, `course_analytics`, `job_postings`, `job_applications`                                                          | 9     |
| Creator Economy       | `creator_profiles`, `creator_earnings`, `creator_payouts`, `creator_memberships`, `user_subscriptions`, `tips`, `brand_partnerships`, `creator_analytics`                                                  | 8     |
| Stella AI             | `stella_commands`, `stella_scheduled_actions`, `stella_settings`, `stella_action_log`, `ai_chat_history`, `ai_suggestions`, `ai_usage_tracking`                                                            | 7     |
| Voice & Video         | `call_sessions`, `call_participants`, `call_logs`, `webrtc_tokens`, `voice_messages`                                                                                                                       | 5     |
| Geolocation           | `user_locations`, `location_permissions`, `location_shares`, `location_logs`, `geofences`, `geofence_triggers`                                                                                             | 6     |
| Push Notifications    | `device_tokens`, `push_subscriptions`, `push_notifications`, `push_notification_logs`, `notification_templates`, `web_push_subscriptions`                                                                  | 6     |
| Media Storage         | `media_files`, `media_ownership`, `media_reports`, `media_processing_jobs`, `storage_quotas`                                                                                                               | 5     |
| Security & Compliance | `user_consents`, `data_export_requests`, `data_deletion_requests`, `audit_logs`, `security_logs`, `fraud_checks`, `rate_limits`, `payment_logs`                                                            | 8     |
| Business Verification | `business_verifications`                                                                                                                                                                                   | 1     |
| Admin & Moderation    | `admin_roles`, `moderation_queue`, `feature_flags`, `system_settings`                                                                                                                                      | 4     |
| Gamification          | `transactions`, `missions`, `user_missions`, `spin_history`, `leaderboard`                                                                                                                                 | 5     |

---

## Migrations

Migrations live in `supabase/migrations/`. Each migration file is a timestamped SQL file.

```bash
# Apply all pending migrations
supabase db push

# Create a new migration
supabase migration new <migration-name>

# View migration status
supabase migration list
```

---

## Key Conventions

- All primary keys use `uuid` type with `gen_random_uuid()` as default.
- All tables have `created_at TIMESTAMPTZ DEFAULT now()` columns.
- Soft deletes use `deleted_at TIMESTAMPTZ` where applicable.
- All monetary amounts are stored as `INTEGER` (cents) or `NUMERIC(12,2)` (euros).
- User IDs reference `auth.users(id)` with `ON DELETE CASCADE`.

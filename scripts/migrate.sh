#!/usr/bin/env bash
# scripts/migrate.sh - Apply Supabase database migrations
set -euo pipefail

echo "🗄️  Running Supabase database migrations..."

# Check Supabase CLI
command -v supabase >/dev/null 2>&1 || {
  echo "❌ Supabase CLI not found. Install with: npm install -g supabase"
  exit 1
}

ENV="${1:-local}"

if [ "$ENV" = "local" ]; then
  echo "📍 Applying migrations to local Supabase..."
  supabase db push
elif [ "$ENV" = "remote" ]; then
  echo "📍 Applying migrations to remote Supabase (linked project)..."
  supabase db push --linked
else
  echo "Usage: ./scripts/migrate.sh [local|remote]"
  exit 1
fi

echo "✅ Migrations applied successfully!"

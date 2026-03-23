#!/usr/bin/env bash
# scripts/migrate.sh — Apply Supabase database migrations
set -euo pipefail

echo "🗄️  Beauty Style Pro — Database Migrations"
echo "============================================"

# Determine environment
ENV="${1:-local}"

case "$ENV" in
  local)
    echo "🔧 Applying migrations to LOCAL Supabase instance..."
    supabase db push
    echo "✅ Local migrations applied."
    ;;
  staging)
    echo "🚀 Applying migrations to STAGING..."
    supabase db push --linked
    echo "✅ Staging migrations applied."
    ;;
  production)
    echo "⚠️  Applying migrations to PRODUCTION..."
    read -r -p "Are you sure? This is irreversible! [y/N] " confirm
    if [[ "$confirm" =~ ^[Yy]$ ]]; then
      supabase db push --linked
      echo "✅ Production migrations applied."
    else
      echo "❌ Aborted."
      exit 1
    fi
    ;;
  *)
    echo "Usage: $0 [local|staging|production]"
    exit 1
    ;;
esac

echo ""
echo "Migration list:"
supabase migration list 2>/dev/null || echo "(Run 'supabase migration list' for status)"

#!/usr/bin/env bash
# migrate.sh — Run Supabase database migrations
# Usage: bash scripts/migrate.sh [push|reset|pull]
#
# Commands:
#   push   — Apply pending migrations to the linked remote project (default)
#   reset  — Reset local Supabase database (LOCAL ONLY — DESTRUCTIVE)
#   pull   — Pull remote schema to local migration files

set -e

echo "🗄️  Beauty Style Pro — Database Migration"
echo "==========================================="

# Check Supabase CLI
if ! command -v supabase &>/dev/null; then
  echo "❌ Supabase CLI is not installed."
  echo "   Install with: npm i -g supabase"
  exit 1
fi

COMMAND="${1:-push}"

case "$COMMAND" in
  push)
    echo ""
    echo "📤 Applying migrations to remote Supabase project..."
    echo "⚠️  This will modify your REMOTE database. Ensure you have a backup."
    read -rp "Continue? (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
      echo "Aborted."
      exit 0
    fi
    supabase db push
    echo "✅ Migrations applied successfully."
    ;;
  
  reset)
    echo ""
    echo "⚠️  WARNING: This will RESET your LOCAL Supabase database."
    echo "   All local data will be lost. This does NOT affect your remote database."
    read -rp "Continue? (y/N): " confirm
    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
      echo "Aborted."
      exit 0
    fi
    supabase db reset
    echo "✅ Local database reset."
    ;;
  
  pull)
    echo ""
    echo "📥 Pulling schema from remote Supabase project..."
    supabase db pull
    echo "✅ Schema pulled. Check supabase/migrations/ for new migration files."
    ;;
  
  *)
    echo "❌ Unknown command: $COMMAND"
    echo "   Usage: bash scripts/migrate.sh [push|reset|pull]"
    exit 1
    ;;
esac

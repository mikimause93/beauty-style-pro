#!/usr/bin/env bash
# deploy.sh — Convenience script to build and deploy Beauty Style Pro
# Usage: bash scripts/deploy.sh [vercel|supabase|all] [--tag <version>]
#
# Requirements:
#   - vercel CLI: npm i -g vercel
#   - supabase CLI: npm i -g supabase
#   - VERCEL_TOKEN env var (or interactive login)

set -e

echo "🚀 Beauty Style Pro — Deploy Script"
echo "======================================"

TARGET="${1:-all}"
TAG=""

# Parse --tag argument
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --tag) TAG="$2"; shift ;;
    *) ;;
  esac
  shift
done

# ── Build ─────────────────────────────────────────────────────
echo ""
echo "🔨 Building project..."
npm run build
echo "✅ Build successful."

# ── Deploy to Vercel ──────────────────────────────────────────
deploy_vercel() {
  echo ""
  echo "▲  Deploying to Vercel..."
  if ! command -v vercel &>/dev/null; then
    echo "❌ Vercel CLI not found. Install with: npm i -g vercel"
    exit 1
  fi
  vercel --prod --yes
  echo "✅ Deployed to Vercel."
}

# ── Deploy Supabase Edge Functions ────────────────────────────
deploy_supabase() {
  echo ""
  echo "⚡ Deploying Supabase Edge Functions..."
  if ! command -v supabase &>/dev/null; then
    echo "❌ Supabase CLI not found. Install with: npm i -g supabase"
    exit 1
  fi
  supabase functions deploy
  echo "✅ Edge Functions deployed."
}

# ── Create Git Tag & Release ──────────────────────────────────
create_tag() {
  if [ -n "$TAG" ]; then
    echo ""
    echo "🏷️  Creating release tag: $TAG"
    git tag "$TAG"
    git push origin "$TAG"
    echo "✅ Tag $TAG pushed. GitHub Actions will create the release automatically."
  fi
}

case "$TARGET" in
  vercel)
    deploy_vercel
    create_tag
    ;;
  supabase)
    deploy_supabase
    create_tag
    ;;
  all)
    deploy_vercel
    deploy_supabase
    create_tag
    ;;
  *)
    echo "❌ Unknown target: $TARGET"
    echo "   Usage: bash scripts/deploy.sh [vercel|supabase|all] [--tag v3.1.0]"
    exit 1
    ;;
esac

echo ""
echo "🎉 Deploy complete!"

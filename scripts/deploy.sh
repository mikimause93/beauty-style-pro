#!/usr/bin/env bash
# scripts/deploy.sh — Deploy frontend + Supabase functions
set -euo pipefail

echo "🚀 Beauty Style Pro — Deployment"
echo "=================================="

ENV="${1:-production}"

# Build frontend
echo "📦 Building frontend..."
npm run build
echo "✅ Build complete"

# Deploy to Vercel
echo ""
echo "🌐 Deploying to Vercel ($ENV)..."
if [ "$ENV" = "production" ]; then
  vercel --prod
else
  vercel
fi
echo "✅ Vercel deployment complete"

# Deploy Supabase Edge Functions
echo ""
echo "⚡ Deploying Supabase Edge Functions..."
supabase functions deploy
echo "✅ Edge functions deployed"

# Apply database migrations
echo ""
echo "🗄️  Applying database migrations..."
bash "$(dirname "$0")/migrate.sh" "$ENV"

echo ""
echo "🎉 Deployment complete!"

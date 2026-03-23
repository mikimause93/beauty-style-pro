#!/usr/bin/env bash
# scripts/deploy.sh - Deploy the application
set -euo pipefail

echo "🚀 Deploying Beauty Style Pro..."

# Check required tools
command -v npm >/dev/null 2>&1 || { echo "❌ npm required"; exit 1; }
command -v vercel >/dev/null 2>&1 || { echo "❌ Vercel CLI required: npm i -g vercel"; exit 1; }

TARGET="${1:-preview}"

echo "📦 Building application..."
npm run build

if [ "$TARGET" = "production" ] || [ "$TARGET" = "prod" ]; then
  echo "🌍 Deploying to PRODUCTION (Vercel --prod)..."
  vercel --prod
elif [ "$TARGET" = "preview" ]; then
  echo "🔍 Deploying PREVIEW to Vercel..."
  vercel
else
  echo "Usage: ./scripts/deploy.sh [preview|production]"
  exit 1
fi

echo "✅ Deployment complete!"

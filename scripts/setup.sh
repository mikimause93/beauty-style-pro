#!/usr/bin/env bash
# scripts/setup.sh — Initial development environment setup
set -euo pipefail

echo "🎨 Beauty Style Pro — Development Setup"
echo "========================================"

# Check Node.js version
REQUIRED_NODE="18"
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt "$REQUIRED_NODE" ]; then
  echo "❌ Node.js >= ${REQUIRED_NODE} is required (current: $(node --version))"
  exit 1
fi
echo "✅ Node.js $(node --version)"

# Check npm
echo "✅ npm $(npm --version)"

# Install dependencies
echo ""
echo "📦 Installing npm dependencies..."
npm install

# Check Supabase CLI
if ! command -v supabase &> /dev/null; then
  echo ""
  echo "⚠️  Supabase CLI not found. Installing via npm..."
  npm install -g supabase
fi
echo "✅ Supabase CLI $(supabase --version)"

# Copy env file
if [ ! -f ".env.local" ]; then
  echo ""
  echo "📝 Creating .env.local from .env.example..."
  cp .env.example .env.local
  echo "⚠️  Please edit .env.local and fill in your credentials."
else
  echo "✅ .env.local already exists"
fi

# Setup Husky
echo ""
echo "🪝 Setting up Husky git hooks..."
npm run prepare 2>/dev/null || echo "ℹ️  Husky setup skipped (not a git repo or already set up)"

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit .env.local with your Supabase credentials"
echo "  2. Start local Supabase:  supabase start"
echo "  3. Apply migrations:      supabase db push"
echo "  4. Start dev server:      npm run dev"
echo ""
echo "  → http://localhost:5173"

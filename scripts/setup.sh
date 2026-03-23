#!/usr/bin/env bash
# scripts/setup.sh - Initial development environment setup
set -euo pipefail

echo "🚀 Setting up Beauty Style Pro development environment..."

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required (>= 18)"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm is required (>= 9)"; exit 1; }
command -v git >/dev/null 2>&1 || { echo "❌ Git is required"; exit 1; }

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Node.js 18+ is required (found v$(node -v))"
  exit 1
fi

echo "✅ Prerequisites OK (Node $(node -v), npm $(npm -v))"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy env file if not exists
if [ ! -f ".env.local" ]; then
  cp .env.example .env.local
  echo "📄 Created .env.local from .env.example — fill in your values!"
else
  echo "📄 .env.local already exists, skipping"
fi

# Install husky hooks (if package has prepare script)
if npm run prepare 2>/dev/null; then
  echo "🪝 Husky hooks installed"
fi

echo ""
echo "✅ Setup complete! Next steps:"
echo "  1. Edit .env.local with your Supabase/Stripe/etc. credentials"
echo "  2. Start Supabase locally:  npx supabase start"
echo "  3. Apply migrations:        npx supabase db push"
echo "  4. Start dev server:        npm run dev"

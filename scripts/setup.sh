#!/usr/bin/env bash
# setup.sh — Bootstrap script for local development
# Usage: bash scripts/setup.sh

set -e

echo "🚀 Beauty Style Pro — Local Dev Setup"
echo "======================================="

# 1. Check prerequisites
echo ""
echo "📋 Checking prerequisites..."

check_command() {
  if ! command -v "$1" &>/dev/null; then
    echo "  ❌ $1 is not installed. Please install it and re-run this script."
    exit 1
  else
    echo "  ✅ $1 found: $($1 --version 2>&1 | head -1)"
  fi
}

check_command node
check_command npm
check_command git

# Check Node version >= 18
NODE_MAJOR=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "  ❌ Node.js >= 18 is required. Current: $(node --version)"
  exit 1
fi

# 2. Install dependencies
echo ""
echo "📦 Installing npm dependencies..."
npm install

# 3. Copy .env.example to .env.local (if not exists)
echo ""
echo "🔧 Setting up environment variables..."
if [ ! -f ".env.local" ]; then
  cp .env.example .env.local
  echo "  ✅ Created .env.local from .env.example"
  echo "  ⚠️  Please fill in your actual values in .env.local"
else
  echo "  ℹ️  .env.local already exists, skipping."
fi

# 4. Setup Supabase (optional)
if command -v supabase &>/dev/null; then
  echo ""
  echo "🗄️  Supabase CLI detected. Setting up local Supabase..."
  
  read -rp "  Link to remote Supabase project? (y/N): " link_supabase
  if [[ "$link_supabase" =~ ^[Yy]$ ]]; then
    read -rp "  Enter your Supabase project ref: " project_ref
    supabase link --project-ref "$project_ref"
    echo "  ✅ Linked to Supabase project: $project_ref"
    
    read -rp "  Pull remote schema? (y/N): " pull_schema
    if [[ "$pull_schema" =~ ^[Yy]$ ]]; then
      supabase db pull
      echo "  ✅ Schema pulled."
    fi
  fi

  read -rp "  Start local Supabase? (y/N): " start_supabase
  if [[ "$start_supabase" =~ ^[Yy]$ ]]; then
    supabase start
    echo "  ✅ Local Supabase started. Visit Studio at http://localhost:54323"
  fi
else
  echo ""
  echo "  ℹ️  Supabase CLI not found. Install it with: npm i -g supabase"
fi

# 5. Setup git hooks (Husky)
if [ -f ".husky/pre-commit" ]; then
  echo ""
  echo "🪝  Git hooks already configured."
else
  echo ""
  echo "🪝  Setting up git hooks..."
  npx husky install 2>/dev/null || true
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Fill in .env.local with your API keys"
echo "  2. Run: npm run dev"
echo "  3. Open: http://localhost:8080"

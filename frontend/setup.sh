#!/bin/bash
# ==============================================================================
# ZenOS React Frontend Setup Script
# ==============================================================================
set -e

echo "=== Setting up React Vite Frontend ==="
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 1. Check Node and pnpm availability
echo "Checking tools..."
node -v || { echo "Node.js is required"; exit 1; }
pnpm -v || { echo "pnpm is required (run: npm install -g pnpm)"; exit 1; }

# 2. Materialize environment files
echo "Provisioning environment configuration (.env*)..."
node scripts/ensure-env.js

# 3. Clean and install dependencies
echo "Installing dependencies with pnpm..."
pnpm install

# 4. Build design tokens
echo "Building tokens..."
pnpm tokens:build

echo "=== Frontend setup complete! ==="
echo "Run 'pnpm dev' to start the Vite development server on port 8090."

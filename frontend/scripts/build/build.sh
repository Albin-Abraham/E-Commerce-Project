#!/bin/bash

# Build Script for Frontend Application
# Usage: ./scripts/build/build.sh [environment]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
FULL_CLEAN=${2:-}
BUILD_DIR="dist"
STATS_FILE="stats.html"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Building Frontend Application${NC}"
echo -e "${GREEN}Environment: ${ENVIRONMENT}${NC}"
echo -e "${GREEN}========================================${NC}"

# Step 1: Clean previous build
echo -e "\n${YELLOW}[1/5] Cleaning previous build...${NC}"
if [ "$FULL_CLEAN" = "--full-clean" ]; then
    echo "Performing deep cleanup (removing node_modules)..."
    # Only node_modules. pnpm-lock.yaml is the source of truth for dependency
    # versions; this script used to delete a package-lock.json that no longer
    # exists in this repo.
    rm -rf node_modules
fi

if [ -d "$BUILD_DIR" ]; then
    rm -rf "$BUILD_DIR"
    echo "✓ Cleaned $BUILD_DIR directory"
fi

# Step 2: Install dependencies
echo -e "\n${YELLOW}[2/5] Installing dependencies...${NC}"
# pnpm, not npm: package.json pins `packageManager: pnpm@9.15.4` and preinstall
# runs only-allow pnpm. `npm ci` was here before and could never have worked --
# it requires a package-lock.json, and this repo only has pnpm-lock.yaml.
if [ "$FULL_CLEAN" = "--full-clean" ] || [ ! -d "node_modules" ]; then
    pnpm install
else
    pnpm install --frozen-lockfile
fi
echo "✓ Dependencies installed"

# Step 3 & 4: Type check and build
# Both are delegated to scripts/build_app.js, which owns the integrity gates,
# the valid-mode list and the mode->profile mapping. This script used to run its
# own `npx tsc --noEmit` and `npx vite build --mode`, which meant the mapping was
# duplicated in two places and drifted: it exported VITE_APP_ENV="$ENVIRONMENT",
# but the Vite mode is "test" while the axios profile is "testing", so a test
# build silently fell back to the development profile.
echo -e "\n${YELLOW}[3/5] Type checking and building (delegated to build_app.js)...${NC}"
pnpm build --mode "$ENVIRONMENT"
echo "✓ Build completed"

# Tailwind verification
if [ -d "$BUILD_DIR/assets" ]; then
    CSS_FILE=$(find "$BUILD_DIR/assets" -name "*.css" | head -n 1)
    if [ -n "$CSS_FILE" ]; then
        echo "✓ Tailwind CSS build verified: $(basename $CSS_FILE)"
    else
        echo -e "${RED}Warning: No CSS assets found in build!${NC}"
    fi
fi
echo "✓ Build completed"

# Step 5: Analyze bundle
echo -e "\n${YELLOW}[5/5] Analyzing bundle size...${NC}"
pnpm analyze
echo "✓ Bundle analysis saved to $STATS_FILE"

# Summary
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Build Summary${NC}"
echo -e "${GREEN}========================================${NC}"
echo "Environment: $ENVIRONMENT"
echo "Build directory: $BUILD_DIR"
echo "Bundle stats: $STATS_FILE"

# Check bundle size
BUILD_SIZE=$(du -sh "$BUILD_DIR" | cut -f1)
echo "Total build size: $BUILD_SIZE"

echo -e "\n${GREEN}✓ Build completed successfully!${NC}"

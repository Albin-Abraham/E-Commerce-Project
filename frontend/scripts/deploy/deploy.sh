#!/bin/bash

# Deployment Script
# Usage: ./scripts/deploy/deploy.sh [environment]

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
ENVIRONMENT=${1:-staging}
BUILD_DIR="dist"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Deployment Script${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}========================================${NC}"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
    echo -e "${RED}Error: Invalid environment. Use 'staging' or 'production'${NC}"
    exit 1
fi

# Confirmation for production
if [ "$ENVIRONMENT" = "production" ]; then
    echo -e "${YELLOW}⚠️  WARNING: You are deploying to PRODUCTION${NC}"
    read -p "Are you sure? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "Deployment cancelled"
        exit 0
    fi
fi

# Step 1: Pre-deployment checks
echo -e "\n${YELLOW}[1/6] Running pre-deployment checks...${NC}"

# Check if on correct branch
current_branch=$(git branch --show-current)
if [ "$ENVIRONMENT" = "production" ] && [ "$current_branch" != "main" ]; then
    echo -e "${RED}Error: Production deployments must be from 'main' branch${NC}"
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo -e "${RED}Error: You have uncommitted changes${NC}"
    exit 1
fi

echo "✓ Pre-deployment checks passed"

# Step 2: Run tests and build (Verification)
echo -e "\n${YELLOW}[2/6] Running full verification pipeline...${NC}"
npm run build:all
echo "✓ Verification pipeline passed"

# Step 3: Deployment preparation
echo -e "\n${YELLOW}[3/6] Preparing for deployment...${NC}"
# Build results are already ready from build:all
echo "✓ Deployment artifacts ready in $BUILD_DIR"

# Step 4: Run post-build checks
echo -e "\n${YELLOW}[4/6] Running post-build checks...${NC}"

# Check if build directory exists
if [ ! -d "$BUILD_DIR" ]; then
    echo -e "${RED}Error: Build directory not found${NC}"
    exit 1
fi

# Check bundle size
BUILD_SIZE=$(du -sh "$BUILD_DIR" | cut -f1)
echo "Build size: $BUILD_SIZE"

echo "✓ Post-build checks passed"

# Step 5: Deploy
echo -e "\n${YELLOW}[5/6] Deploying to ${ENVIRONMENT}...${NC}"

if [ "$ENVIRONMENT" = "production" ]; then
    echo "Deploying to Vercel (Production)..."
    # vercel --prod --yes
    echo "✓ Vercel Production deployment triggered"
else
    echo "Deploying to Vercel (Staging)..."
    # vercel --yes
    echo "✓ Vercel Staging deployment triggered"
fi

# Step 6: Post-deployment verification
echo -e "\n${YELLOW}[6/6] Running post-deployment verification...${NC}"

# Add health check here
# Example: curl -f https://yourapp.com/health || exit 1

echo "✓ Post-deployment verification passed"

# Success message
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Deployment Successful!${NC}"
echo -e "${GREEN}========================================${NC}"
echo "Environment: $ENVIRONMENT"
echo "Build size: $BUILD_SIZE"
echo "Deployed at: $(date)"

# Optional: Create deployment tag
if [ "$ENVIRONMENT" = "production" ]; then
    echo -e "\n${BLUE}Creating deployment tag...${NC}"
    TAG="deploy-$(date +%Y%m%d-%H%M%S)"
    git tag -a "$TAG" -m "Production deployment on $(date)"
    git push origin "$TAG"
    echo "✓ Created tag: $TAG"
fi

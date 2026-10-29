#!/bin/bash

# Git Branch Restructuring Script
# This script preserves all existing branches and creates a fresh Git Flow structure

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Git Branch Restructuring${NC}"
echo -e "${BLUE}========================================${NC}"

# Step 1: Fetch all remote branches
echo -e "\n${YELLOW}[1/6] Fetching all remote branches...${NC}"
git fetch --all
echo "✓ Fetched all branches"

# Step 2: Create backup tags for safety
echo -e "\n${YELLOW}[2/6] Creating backup tags...${NC}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
git tag "backup-before-restructure-$TIMESTAMP"
git push origin "backup-before-restructure-$TIMESTAMP"
echo "✓ Created backup tag: backup-before-restructure-$TIMESTAMP"

# Step 3: Rename remote branches to *-old
echo -e "\n${YELLOW}[3/6] Renaming remote branches to *-old...${NC}"

# Get list of remote branches (excluding HEAD)
REMOTE_BRANCHES=$(git branch -r | grep -v 'HEAD' | grep 'origin/' | sed 's/origin\///' | tr -d ' ')

for branch in $REMOTE_BRANCHES; do
    echo "  Renaming origin/$branch to origin/${branch}-old"
    
    # Fetch the branch
    git fetch origin "$branch:${branch}-old"
    
    # Push the renamed branch
    git push origin "${branch}-old"
    
    # Delete old remote branch
    git push origin --delete "$branch" || echo "  (Branch already deleted or doesn't exist)"
done

echo "✓ Renamed all remote branches to *-old"

# Step 4: Create new main branch
echo -e "\n${YELLOW}[4/6] Creating new main branch...${NC}"

# Use current branch as base for main
git checkout -b main
git push origin main

echo "✓ Created and pushed new main branch"

# Step 5: Create new develop branch
echo -e "\n${YELLOW}[5/6] Creating new develop branch...${NC}"

git checkout -b develop
git push origin develop

echo "✓ Created and pushed new develop branch"

# Step 6: Set default branch on GitHub (manual step)
echo -e "\n${YELLOW}[6/6] Final steps...${NC}"
echo "✓ Branch restructuring complete!"

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Summary${NC}"
echo -e "${GREEN}========================================${NC}"
echo "Backup tag: backup-before-restructure-$TIMESTAMP"
echo "New branches created:"
echo "  - main (current production baseline)"
echo "  - develop (integration branch)"
echo ""
echo "Old branches preserved with -old suffix"
echo "Local working branches unchanged:"
echo "  - feat/form-rework"
echo "  - feat/react-jest-test"

echo -e "\n${YELLOW}⚠️  Manual Steps Required:${NC}"
echo "1. Go to GitHub → Settings → Branches"
echo "2. Set 'main' as default branch"
echo "3. Add branch protection rules for 'main' and 'develop'"

echo -e "\n${GREEN}✓ Restructuring complete!${NC}"

# Git Branch Restructuring Guide

## Current State

### Remote Branches (origin)

- `main` - Existing main branch
- `development` - Integration branch
- `feat/form` - Feature branch
- `form-rework` - Feature branch
- `react/jest-testing` - Feature branch

### Local Branches

- `feat/form-rework` - Working branch (keep)
- `feat/react-jest-test` - Working branch (keep)
- `feat/react-github-actions` - Current branch
- Other feature branches

## Restructuring Plan

### Step 1: Create Backup Tag

```powershell
# Create safety backup
git tag backup-before-restructure-20260117
git push origin backup-before-restructure-20260117
```

### Step 2: Rename Remote Branches to \*-old

```powershell
# Rename development → development-old
git push origin origin/development:refs/heads/development-old
git push origin --delete development

# Rename feat/form → feat/form-old
git push origin origin/feat/form:refs/heads/feat/form-old
git push origin --delete feat/form

# Rename form-rework → form-rework-old
git push origin origin/form-rework:refs/heads/form-rework-old
git push origin --delete form-rework

# Rename react/jest-testing → react/jest-testing-old
git push origin origin/react/jest-testing:refs/heads/react/jest-testing-old
git push origin --delete react/jest-testing

# Keep origin/main as main-old
git push origin origin/main:refs/heads/main-old
```

### Step 3: Create Fresh Main Branch

```powershell
# Create new main from current stable state
git checkout feat/react-github-actions
git checkout -b main-new
git push origin main-new

# Update origin/main to point to new main
git push origin main-new:main --force
git branch -d main-new
```

### Step 4: Create Fresh Develop Branch

```powershell
# Create develop from new main
git checkout main
git pull origin main
git checkout -b develop
git push origin develop
```

### Step 5: Update Local Working Branches

```powershell
# Your local branches remain unchanged:
# - feat/form-rework (keep as-is)
# - feat/react-jest-test (keep as-is)

# Update tracking for current branch
git checkout develop
```

## Final Structure

### Remote (origin)

```
main                    # Fresh start (from current code)
develop                 # Fresh integration branch
main-old                # Preserved old main
development-old         # Preserved old development
feat/form-old           # Preserved
form-rework-old         # Preserved
react/jest-testing-old  # Preserved
```

### Local

```
main                    # Tracks origin/main
develop                 # Tracks origin/develop
feat/form-rework        # Your working branch
feat/react-jest-test    # Your working branch
```

## Verification Commands

```powershell
# Check all branches
git branch -a

# Check remote branches
git branch -r

# Verify backup tag
git tag -l "backup*"

# Check current branch
git status
```

## Rollback Plan (if needed)

```powershell
# If something goes wrong, restore from backup
git checkout backup-before-restructure-20260117
git checkout -b main
git push origin main --force

# Restore old branches
git push origin main-old:development --force
```

## Next Steps After Restructuring

1. **Set Default Branch on GitHub**
   - Go to: Settings → Branches
   - Set `main` as default

2. **Add Branch Protection**
   - Protect `main`: Require 2 reviews, passing CI
   - Protect `develop`: Require 1 review, passing CI

3. **Update Team**
   - Notify team of new structure
   - Share branching strategy doc

4. **Create First Feature**
   ```powershell
   git checkout develop
   git pull origin develop
   git checkout -b feature/TICKET-001-description
   ```

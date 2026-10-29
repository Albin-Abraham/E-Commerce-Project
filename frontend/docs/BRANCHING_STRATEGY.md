# Git Branching Strategy

## Overview

This document outlines the branching strategy for the project, following Git Flow principles adapted for modern CI/CD practices.

## Branch Types

### Main Branches

#### `main`

- **Purpose**: Production-ready code
- **Protection**:
  - Requires PR approval (minimum 2 reviewers)
  - All CI checks must pass
  - No direct commits allowed
- **Deployment**: Auto-deploys to production on merge
- **Naming**: Always `main`

#### `develop`

- **Purpose**: Integration branch for features
- **Protection**:
  - Requires PR approval (minimum 1 reviewer)
  - All CI checks must pass
- **Deployment**: Auto-deploys to staging environment
- **Naming**: Always `develop`

### Supporting Branches

#### Feature Branches

- **Purpose**: New features or enhancements
- **Naming Convention**: `feature/<ticket-id>-<short-description>`
  - Example: `feature/HRMS-123-employee-onboarding`
- **Branch From**: `develop`
- **Merge To**: `develop`
- **Lifetime**: Deleted after merge
- **Protection**: None (developer's responsibility)

#### Bugfix Branches

- **Purpose**: Bug fixes for develop branch
- **Naming Convention**: `bugfix/<ticket-id>-<short-description>`
  - Example: `bugfix/HRMS-456-fix-attendance-calculation`
- **Branch From**: `develop`
- **Merge To**: `develop`
- **Lifetime**: Deleted after merge

#### Hotfix Branches

- **Purpose**: Critical production fixes
- **Naming Convention**: `hotfix/<ticket-id>-<short-description>`
  - Example: `hotfix/HRMS-789-fix-payroll-crash`
- **Branch From**: `main`
- **Merge To**: Both `main` AND `develop`
- **Lifetime**: Deleted after merge
- **Priority**: Highest - bypasses normal release cycle

#### Release Branches

- **Purpose**: Prepare for production release
- **Naming Convention**: `release/v<version>`
  - Example: `release/v1.2.0`
- **Branch From**: `develop`
- **Merge To**: Both `main` AND `develop`
- **Lifetime**: Deleted after merge
- **Activities**:
  - Final testing
  - Version bumping
  - Documentation updates
  - Minor bug fixes only

## Workflow Examples

### Feature Development

```bash
# 1. Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/HRMS-123-employee-onboarding

# 2. Make changes and commit
git add .
git commit -m "feat(hrms): add employee onboarding form"

# 3. Push and create PR
git push origin feature/HRMS-123-employee-onboarding
# Create PR: feature/HRMS-123-employee-onboarding → develop

# 4. After PR approval and merge, delete branch
git checkout develop
git pull origin develop
git branch -d feature/HRMS-123-employee-onboarding
```

### Hotfix Workflow

```bash
# 1. Create hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/HRMS-789-fix-payroll-crash

# 2. Fix the issue
git add .
git commit -m "fix(payroll): resolve calculation crash"

# 3. Create PR to main
git push origin hotfix/HRMS-789-fix-payroll-crash
# Create PR: hotfix/HRMS-789-fix-payroll-crash → main

# 4. After merge to main, also merge to develop
git checkout develop
git pull origin develop
git merge hotfix/HRMS-789-fix-payroll-crash
git push origin develop

# 5. Delete hotfix branch
git branch -d hotfix/HRMS-789-fix-payroll-crash
```

### Release Workflow

```bash
# 1. Create release branch from develop
git checkout develop
git pull origin develop
git checkout -b release/v1.2.0

# 2. Update version and changelog
npm version 1.2.0
# Update CHANGELOG.md

git add .
git commit -m "chore(release): prepare v1.2.0"

# 3. Push and create PR to main
git push origin release/v1.2.0
# Create PR: release/v1.2.0 → main

# 4. After merge to main, also merge to develop
git checkout develop
git merge release/v1.2.0
git push origin develop

# 5. Tag the release
git checkout main
git pull origin main
git tag -a v1.2.0 -m "Release version 1.2.0"
git push origin v1.2.0
```

## Branch Protection Rules

### `main` Branch

```yaml
Required:
  - Pull request reviews: 2
  - Status checks:
      - code-quality
      - test
      - build
  - Conversation resolution
  - Signed commits
  - Linear history
Restrictions:
  - No force push
  - No deletions
  - Administrators included
```

### `develop` Branch

```yaml
Required:
  - Pull request reviews: 1
  - Status checks:
      - code-quality
      - test
      - build
  - Conversation resolution
Restrictions:
  - No force push
  - No deletions
```

## Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test additions/changes
- `chore`: Build process or auxiliary tool changes
- `ci`: CI configuration changes

### Examples

```bash
feat(hrms): add employee bulk upload feature

Implements CSV upload for employee data with validation
and error reporting.

Closes HRMS-123
```

```bash
fix(payroll): correct overtime calculation

The overtime multiplier was using wrong base rate.
Fixed to use hourly rate instead of daily rate.

Fixes HRMS-456
```

## Best Practices

1. **Keep branches short-lived**: Merge within 2-3 days
2. **Sync regularly**: Pull from develop daily
3. **Small, focused PRs**: Easier to review and merge
4. **Write descriptive commit messages**: Future you will thank you
5. **Delete merged branches**: Keep repository clean
6. **Never commit directly to main/develop**: Always use PRs
7. **Resolve conflicts locally**: Before pushing
8. **Tag releases**: Use semantic versioning

## Troubleshooting

### Merge Conflicts

```bash
# Update your branch with latest develop
git checkout feature/your-branch
git fetch origin
git merge origin/develop

# Resolve conflicts
# ... edit files ...
git add .
git commit -m "chore: resolve merge conflicts"
git push origin feature/your-branch
```

### Accidentally Committed to Wrong Branch

```bash
# If not pushed yet
git reset HEAD~1  # Undo last commit, keep changes
git stash         # Save changes
git checkout correct-branch
git stash pop     # Apply changes
git add .
git commit -m "your message"
```

## References

- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)

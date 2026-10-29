# CI/CD & Development Infrastructure

## 📁 Directory Structure

```
react-vite/                      # repository root
├── .github/                    # MUST live here or GitHub ignores it
│   ├── workflows/              # GitHub Actions workflows
│   │   ├── pr-validation.yml  # PR checks
│   │   ├── main-ci.yml        # Main branch CI
│   │   └── deploy.yml         # Production deployment
│   └── changelog-config.json  # Release notes configuration
│
└── frontend/                    # the application
    ├── scripts/
    │   ├── build/
    │   │   └── build.sh          # Build script
    │   ├── test/
    │   │   └── run-tests.sh      # Test runner
    │   └── deploy/
    │       └── deploy.sh         # Deployment script
    │
    └── docs/
        ├── BRANCHING_STRATEGY.md      # Git workflow guide
        ├── CI_CD_WORKFLOWS.md         # CI/CD documentation
        ├── DEVELOPMENT_GUIDELINES.md  # Code standards
        └── CODE_REVIEW_CHECKLIST.md   # Review guidelines
```

> **Workflows only run from the repository root.** GitHub Actions ignores
> `.github/workflows/` in any subdirectory, so these files must stay at
> `react-vite/.github/workflows/`, not under `frontend/`. Every path _inside_
> them is written relative to that root (`working-directory: frontend`,
> `context: frontend`, `paths: ["frontend/**"]`), so moving them is the only
> change required — their contents need no editing.

## 🚀 Quick Start

### For Developers

1. **Clone and Setup**

   ```bash
   git clone <repository>
   cd frontend
   npm install
   ```

2. **Start Development**

   ```bash
   npm run dev
   ```

3. **Create Feature Branch**

   ```bash
   git checkout -b feature/TICKET-123-description
   ```

4. **Run Tests**

   ```bash
   npm test
   ```

5. **Create Pull Request**
   - Push your branch
   - Create PR to `develop`
   - Wait for CI checks
   - Request review

### For Reviewers

1. **Review Checklist**: See [CODE_REVIEW_CHECKLIST.md](./CODE_REVIEW_CHECKLIST.md)
2. **Approve or Request Changes**
3. **Merge when ready**

## 📋 Available Scripts

### Development

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm test             # Run tests
npm run lint         # Run linter
npm run type-check   # TypeScript check
```

### CI/CD Scripts

```bash
./scripts/build/build.sh [environment]     # Build with checks
./scripts/test/run-tests.sh [--coverage]  # Run test suite
./scripts/deploy/deploy.sh [environment]  # Deploy application
```

## 🔄 Workflows

### Feature Development

```
develop → feature/XXX → PR → develop → staging
```

### Release

```
develop → release/vX.X.X → PR → main → production
```

### Hotfix

```
main → hotfix/XXX → PR → main → production
                    └──→ develop
```

## 📚 Documentation

- **[Branching Strategy](./BRANCHING_STRATEGY.md)** - Git workflow and branch management
- **[CI/CD Workflows](./CI_CD_WORKFLOWS.md)** - Pipeline documentation
- **[Development Guidelines](./DEVELOPMENT_GUIDELINES.md)** - Code standards and best practices
- **[Code Review Checklist](./CODE_REVIEW_CHECKLIST.md)** - Review guidelines

## 🎯 Key Principles

1. **Branch-Based Development** - All work in feature branches
2. **CI/CD Automation** - Automated testing and deployment
3. **Code Review** - All changes reviewed before merge
4. **Documentation** - Keep docs up-to-date
5. **Quality First** - Tests and linting must pass

## 🔐 Security

- Never commit secrets
- Use environment variables
- Run security scans in CI
- Keep dependencies updated

## 📊 Metrics

Track these in your team:

- PR merge time
- CI success rate
- Deployment frequency
- Test coverage

## 🆘 Getting Help

- Check documentation first
- Ask in team chat
- Create an issue
- Contact DevOps team

## 🎓 Learning Resources

- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [React Best Practices](https://react.dev/learn)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Last Updated**: 2026-01-17  
**Maintained By**: Development Team

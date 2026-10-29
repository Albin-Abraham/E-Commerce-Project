# Code Review Checklist

## For Pull Request Authors

### Before Creating PR

- [ ] **Code Quality**
  - [ ] Code follows project style guide
  - [ ] No linting errors (`npm run lint`)
  - [ ] No TypeScript errors (`npx tsc --noEmit`)
  - [ ] Code is properly formatted (`npx prettier --check`)

- [ ] **Testing**
  - [ ] All tests pass (`npm test`)
  - [ ] New features have tests
  - [ ] Bug fixes have regression tests
  - [ ] Coverage meets minimum threshold (80%)

- [ ] **Documentation**
  - [ ] README updated if needed
  - [ ] API documentation updated
  - [ ] Complex logic has comments
  - [ ] CHANGELOG.md updated

- [ ] **Git Hygiene**
  - [ ] Meaningful commit messages
  - [ ] Commits are logical and atomic
  - [ ] No merge commits (rebase if needed)
  - [ ] Branch is up-to-date with target branch

- [ ] **PR Description**
  - [ ] Clear title following convention
  - [ ] Description explains WHAT and WHY
  - [ ] Links to related ticket/issue
  - [ ] Screenshots for UI changes
  - [ ] Breaking changes highlighted

### Self-Review Checklist

- [ ] **Code Cleanliness**
  - [ ] No commented-out code
  - [ ] No console.log or debugger statements
  - [ ] No TODO comments (create tickets instead)
  - [ ] No unnecessary files changed

- [ ] **Performance**
  - [ ] No unnecessary re-renders
  - [ ] Expensive operations memoized
  - [ ] Images optimized
  - [ ] Bundle size impact acceptable

- [ ] **Security**
  - [ ] No hardcoded secrets
  - [ ] User input sanitized
  - [ ] No SQL injection vulnerabilities
  - [ ] No XSS vulnerabilities

---

## For Code Reviewers

### First Pass: High-Level Review

- [ ] **Purpose & Scope**
  - [ ] PR solves the stated problem
  - [ ] Changes are in scope
  - [ ] No unnecessary changes
  - [ ] Approach makes sense

- [ ] **Architecture**
  - [ ] Follows project patterns
  - [ ] Proper separation of concerns
  - [ ] No architectural violations
  - [ ] Reuses existing code where possible

### Second Pass: Detailed Review

#### Code Quality

- [ ] **Readability**
  - [ ] Code is self-documenting
  - [ ] Variable names are descriptive
  - [ ] Functions are focused and small
  - [ ] Complex logic has comments

- [ ] **Correctness**
  - [ ] Logic is sound
  - [ ] Edge cases handled
  - [ ] Error handling is appropriate
  - [ ] No obvious bugs

- [ ] **TypeScript**
  - [ ] Proper type definitions
  - [ ] No use of `any`
  - [ ] Interfaces/types are reusable
  - [ ] Generics used appropriately

#### Testing

- [ ] **Coverage**
  - [ ] Critical paths tested
  - [ ] Edge cases tested
  - [ ] Error scenarios tested
  - [ ] Tests are meaningful (not just for coverage)

- [ ] **Test Quality**
  - [ ] Tests are readable
  - [ ] Tests are maintainable
  - [ ] No flaky tests
  - [ ] Proper assertions

#### Performance

- [ ] **Optimization**
  - [ ] No unnecessary computations
  - [ ] Proper use of memoization
  - [ ] Lazy loading where appropriate
  - [ ] No memory leaks

- [ ] **Bundle Size**
  - [ ] New dependencies justified
  - [ ] Tree-shaking considered
  - [ ] Code splitting used
  - [ ] Bundle impact acceptable

#### Security

- [ ] **Data Handling**
  - [ ] Input validation
  - [ ] Output sanitization
  - [ ] No sensitive data in logs
  - [ ] Proper authentication/authorization

- [ ] **Dependencies**
  - [ ] No known vulnerabilities
  - [ ] Dependencies are necessary
  - [ ] Versions are pinned
  - [ ] License compatibility

#### Accessibility

- [ ] **WCAG Compliance**
  - [ ] Keyboard navigation works
  - [ ] Screen reader support
  - [ ] Proper ARIA labels
  - [ ] Color contrast sufficient
  - [ ] Focus indicators visible

#### UI/UX (if applicable)

- [ ] **User Experience**
  - [ ] Matches design specs
  - [ ] Responsive on all screen sizes
  - [ ] Loading states handled
  - [ ] Error states handled
  - [ ] Empty states handled

- [ ] **Consistency**
  - [ ] Follows design system
  - [ ] Consistent with existing UI
  - [ ] Proper spacing/alignment
  - [ ] Animations are smooth

### Third Pass: Context Review

- [ ] **Documentation**
  - [ ] Code comments where needed
  - [ ] API docs updated
  - [ ] README updated
  - [ ] Migration guide (if breaking)

- [ ] **Dependencies**
  - [ ] package.json updated correctly
  - [ ] Lock file updated
  - [ ] No unused dependencies
  - [ ] Dependency versions appropriate

- [ ] **Configuration**
  - [ ] Environment variables documented
  - [ ] Config files updated
  - [ ] Feature flags used appropriately

---

## Review Guidelines

### Giving Feedback

**Use Conventional Comments**:

- `nit:` - Minor issue, not blocking
- `question:` - Seeking clarification
- `suggestion:` - Optional improvement
- `issue:` - Must be addressed
- `praise:` - Highlight good work

**Examples**:

```
nit: Consider using a more descriptive variable name here

question: Why did you choose this approach over X?

suggestion: This could be simplified using Array.map()

issue: This will cause a memory leak in the useEffect

praise: Great use of memoization here!
```

### Receiving Feedback

- **Be Open**: Feedback is about code, not you
- **Ask Questions**: If feedback is unclear, ask
- **Explain Decisions**: Share your reasoning
- **Be Grateful**: Thank reviewers for their time
- **Iterate**: Address feedback promptly

### Review Turnaround Time

- **Small PRs** (< 200 lines): 4 hours
- **Medium PRs** (200-500 lines): 1 day
- **Large PRs** (> 500 lines): 2 days
- **Urgent/Hotfix**: 1 hour

### When to Approve

✅ **Approve** when:

- All critical issues addressed
- Code meets quality standards
- Tests are comprehensive
- Documentation is adequate

⏸️ **Request Changes** when:

- Critical bugs found
- Security issues present
- Tests are insufficient
- Major refactoring needed

💬 **Comment** when:

- Minor suggestions only
- Seeking clarification
- Sharing knowledge

---

## PR Size Guidelines

### Ideal PR Size

- **Lines changed**: < 400
- **Files changed**: < 10
- **Review time**: < 30 minutes

### Breaking Down Large PRs

If your PR is too large:

1. Split into logical chunks
2. Create separate PRs
3. Link PRs together
4. Merge in order

**Example**:

```
PR 1: Add database models
PR 2: Add API endpoints (depends on PR 1)
PR 3: Add UI components (depends on PR 2)
```

---

## Common Issues & Solutions

### Issue: "This PR is too large"

**Solution**: Break into smaller, focused PRs

### Issue: "Tests are failing"

**Solution**: Run tests locally before pushing

### Issue: "Merge conflicts"

**Solution**: Rebase on target branch

### Issue: "CI is failing"

**Solution**: Check CI logs, fix issues, push again

### Issue: "Unclear what this PR does"

**Solution**: Improve PR description with context

---

## Resources

- [Conventional Comments](https://conventionalcomments.org/)
- [Google Code Review Guidelines](https://google.github.io/eng-practices/review/)
- [Effective Code Reviews](https://www.swarmia.com/blog/a-complete-guide-to-code-reviews/)

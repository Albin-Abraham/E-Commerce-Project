## 📝 Description
<!-- Provide a brief description of the changes introduced by this pull request. -->

## 🔗 Related Issues / Tickets
<!-- e.g. Fixes #123, Refs #456 -->

## 🛡️ ZenOS Quality Checklist
Please verify the following gates before requesting a review:

- [ ] **Formatting & Linting**: Ran `./tools/quality/orchestrator/check.sh fast` and passed.
- [ ] **Architecture Layers**: No cross-layer or circular imports (`tools/quality/architecture/rules/layers.yaml` respected).
- [ ] **Clean Code Standards**:
  - [ ] No debug statements (`breakpoint()`, `import pdb`, `debugger`, etc.).
  - [ ] No blanket `# noqa` or `@ts-ignore` (all suppressions specify codes/reasons).
- [ ] **Testing**:
  - [ ] Unit/domain tests added or updated.
  - [ ] Pytest passes locally.
- [ ] **Database & Migrations**:
  - [ ] `python manage.py check --settings=backend.settings.test` clean.
  - [ ] Any new migrations verified.

## 📸 Screenshots / Proof of Verification (if applicable)
<!-- Attach terminal output or UI screenshot if applicable -->

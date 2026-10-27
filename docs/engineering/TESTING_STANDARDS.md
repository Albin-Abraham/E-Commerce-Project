# ZenOS Engineering: Testing Standards

Standards for writing fast, deterministic, and maintainable automated tests in ZenOS.

---

## 1. Test Pyramid & Execution Strategy

1. **Unit / Domain Tests (`tests/domain/`)**:
   - Test pure business logic, calculations, services, and validation algorithms without hitting the real database.
   - Run in milliseconds.
2. **Integration & API Tests (`tests/`)**:
   - Validate model persistence, serializer validation, HTTP viewsets, permissions, and tenant isolation.
   - Run with `--reuse-db` to optimize local and CI execution times.

---

## 2. Markers & Conventions

- `system`: System integration tests.
- `feature`: End-to-end feature slice tests.
- `module`: App-isolated unit tests.

### Execution Commands
```bash
# Fast domain test suite
pytest tests/domain/

# Full test suite with reusable DB
pytest tests/ --reuse-db
```

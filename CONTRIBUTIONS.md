# 🏗️ Contribution Guide: Zenith Platform Core

Welcome to the **Zenith Healthcare Platform** development core. This project is built as an **Industrialized, Metadata-Driven SaaS Platform**. To maintain architectural integrity, all contributors must adhere to the following standards.

---

## 💎 Core Principles

1.  **Industrialization over Convenience**: Every feature must be robust, logged, and multi-tenant aware. We do not accept "quick hacks."
2.  **Contract-First Orchestration**: Modules communicate via abstract interfaces (`contracts.py`), never via direct model access.
3.  **Platform-Awareness**: The backend is a single source of truth optimized for multiple interfaces (Web, iOS, Android) via context headers.
4.  **Composition over Inheritance**: Use Mixins and Factories to build behavior in both models and tests.

---

## 🚫 Anti-Patterns (The "Wall of Shame")

Avoid these common mistakes to pass architectural review:
- **❌ Direct Cross-App Imports**: Importing `apps.hrms.models` inside `apps.users`. Use the `ServiceRegistry`.
- **❌ Overriding `save()`**: Don't use `save()` for business logic. Use `ValidatorModelMixin` or a Service.
- **❌ Raw DRF Responses**: Returning `Response({"id": 1})`. Always use `ResponseFactory.success()`.
- **❌ Hardcoded Tenant Logic**: Manually filtering by `company_id`. Use `TenantModelMixin` for automatic scoping.
- **❌ Magic Strings**: Hardcoding session keys. Use the `SessionContext` manager.
- **❌ Direct DB in Tests**: Using `Model.objects.create()` in a test suite. Use `FactoryBoy` factories.

---

## 🏛️ Architectural Standards: Vertical Slices

We use **Vertical Slices** where every feature is self-contained.

### Directory Structure per App:
```text
apps/<module>/
├── contracts.py       # Public abstract interfaces
├── models/            # Domain models (Inherit from core mixins)
├── services/          # Business logic (Implementation of contracts)
├── views/             # API views (Inherit from BaseAPIView)
├── serializers/       # DRF Serializers
└── tests/             # Mixin-based TDD suites
```

---

## 📱 Interface Orchestration (Mobile & Web)

The backend is a **Universal Interface**. To support both Web and Mobile efficiently:

- **X-Platform Header**: Respect the `X-Platform` header (injected into serializer context).
- **Select Mode**: Use `Is-Select-Option: true` for mobile dropdowns to trigger the `select_serializer_class`.
- **Integrity Guards**: `BaseAPIView` automatically performs "Tenant Drifting" checks to ensure JWT claims match session context.

---

## 🧪 Testing Guidelines (Mixin-First TDD)

1.  **Factories Only**: All test data must come from `factory_boy`.
2.  **Explicit Mixins**: Compose your test class using specific capability mixins:
    - `CreationMixin`: Standardized instance creation.
    - `ValidationMixin`: `assert_valid()` and `assert_invalid()`.
    - `AssertionMixin`: Deep JSON and relationship checks.
3.  **Zero-Behavior Base**: `BaseTest` should remain a minimal class with no hidden DB overhead.

---

## 🛠️ Implementation Guidelines

- **Validation**: Use `ValidatorModelMixin` with declarative rules (`UniqueRule`, `PasswordValidatorRule`).
- **Throttling**: Always rely on `TenantDynamicThrottle` for scaling limits per tenant.
- **Async Operations**: If a mutation affects >50 records, use the `perform_create_async` hook to offload to Celery.
- **Audit Logging**: Ensure `audit_enabled = True` (default) on all views that mutate data.

---

## 🚦 Merge Request Checklist

- [ ] Feature is encapsulated in a vertical slice.
- [ ] Public contract defined in `contracts.py` if cross-module access is needed.
- [ ] Models use `TenantModelMixin` and `ValidatorModelMixin`.
- [ ] 100% test coverage using the Mixin-first pattern.
- [ ] API documentation (Swagger/OpenAPI) updated via `drf-spectacular`.

---

> [!IMPORTANT]
> This platform is designed for "Industrial" reliability. Code readability, type safety, and architectural adherence are prioritized over delivery speed.

# 🧩 Vertical Slice Architecture (Apps)

The Backend-RestFul project is organized into self-contained "Vertical Slices" (Django Apps). This architecture ensures that domain logic remains encapsulated and that features can be developed, tested, and scaled independently.

## 🏛️ Standard App Structure

Every app in the `apps/` directory follows a strict, predictable structure:

```text
apps/<app_name>/
├── models/            # Domain entities and business invariants
├── serializers/       # Technical and domain validation orchestration
├── views/             # API Gatekeepers and request handling
├── services/          # Cross-cutting or complex domain logic
├── tests/             # Unit and integration tests
├── admin.py           # Admin panel registration
├── apps.py            # App configuration
├── urls.py            # Routing specific to this domain
└── permissions.py     # (Optional) Domain-specific permission logic
```

---

## 🚦 Key Rules for App Development

### 1. Dependency Direction
- **Inward Only**: Domain models should not depend on serializers or views.
- **Core Dependency**: Apps depend on `core/` for infrastructure, but `core/` should NEVER depend on an app.

### 2. Business Logic Placement
- **Invariants**: Place strict data rules in the `models/` (via `validation_rules`).
- **Orchestration**: Place complex workflows or multi-model actions in `services/`.
- **Validation**: Trigger validation at the `serializer` level using the `ValidationMediator`.

### 3. "Dumb" Models, "Smart" Serializers
As per our foundational directive, models should remain largely "Dumb" (not executing logic automatically). Serializers act as the "Smart" layer that orchestrates domain validation before the DB transaction begins.

### 4. Cross-App Communication
Apps should communicate with each other through **Services**, never by importing models directly for modification. If App A needs to change data in App B, it must call a Service method in App B.

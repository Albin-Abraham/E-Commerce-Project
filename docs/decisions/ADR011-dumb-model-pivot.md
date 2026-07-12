# **ADR-011: Dumb Model Strategy & Mediator-Led Validation**

**Status:** Accepted
**Date:** 2026-03-29
**Decision Type:** Architectural Pattern / Domain Logic Enforcement

---

## 1. Context

In a complex Modular Monolith, the traditional Django "Smart Model" approach (where logic is embedded in `clean()` and `save()`) presented several challenges:
- **ORM Coupling**: Domain logic became tightly coupled to the Django framework, making it harder to test and extract.
- **Database Locking**: Complex validation rules triggered during the clean/save phase often led to row-level locks and performance degradation in high-concurrency environments.
- **Hidden Side Effects**: Automatic validation made it difficult to bypass specific rules for migrations or high-performance batch updates.

---

## 2. Decision

Pivoted the domain layer to a **"Dumb Model"** architecture, where models act primarily as pure data containers.

1. **Rule Separation**: Business invariants are encapsulated in standalone **Strategy Rule Objects** (e.g., `RequiredRule`, `UniqueRule`).
2. **Mediator Orchestration**: A central **`ValidationMediator`** is responsible for collecting rules from the model and executing them against the current `context`.
3. **Explicit Enforcement**: Validation is no longer automatic. It must be explicitly triggered by the **Serializer** or **Service** tier before the database transaction begins.
4. **Optimistic Locking**: Every `BaseModel` includes a `version` field to ensure data integrity without constant row-locking.

---

## 3. Rationale

- **Clean Architecture**: Fulfills the requirement that the Domain Layer should not depend on core framework/infrastructure code.
- **Performance**: Moves the expensive validation logic out of the database transaction, significantly reducing lock contention.
- **Explicit Content**: Developer choice is prioritized. Validation is intentional, reducing the risk of "Magic" behavior causing bugs.
- **Testability**: Domain rules can be tested in isolation without needing a fully initialized Django model or active database connection.

---

## 4. Consequences

### Positive
- Predictable, O(1) database transaction times for metadata updates.
- Decoupled domain rules that are easier to version and audit.
- Clear separation between "API Input Truth" and "Domain State Truth".

### Negative
- Direct model saves (e.g., in management scripts) bypass business rules unless the `ValidationMediator` is explicitly invoked.
- Requires a mindset shift for developers accustomed to the standard Django "Smart Model" pattern.

---

## 5. Alternatives Considered

### Stick to "Smart Models" 
Rejected → Lead to significant performance issues and ORM-logic pollution.

### Service-Layer Only Validation
Rejected → While decoupled, it left the model layer vulnerable to corruption if modified outside of a specific service. The "Dumb Model" still maintains the *definition* of rules, even if it doesn't *execute* them itself.

---

## 6. Implementation Plan

1. Integrate `ValidatorModelMixin` into `BaseModel`.
2. Implement the `ValidationMediator` for cross-tier orchestration.
3. Update `core.base_models.fields` to support rule registration.
4. Update standard Serializers to invoke the Mediator by default.

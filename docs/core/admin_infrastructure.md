# 🛠️ Admin Infrastructure & System Services

The `core/admin` directory is the platform's control center, providing essential services for modularity, system-level integrity, and observability.

## 🏛️ Architecture & Patterns

The admin layer avoids direct business logic in views, favoring a **Generic Service Pattern**.

### 1. Generic Base Service (`BaseService[T]`)
Located in `core/admin/services/base_service.py`, this class provides type-safe CRUD operations with built-in:
- **Multi-Tenancy**: Automated filtering based on the user's `Company` and `Division`.
- **Conflict Management**: Uses `@retry_on_conflict` decorators to handle concurrent updates gracefully.
- **Atomic Reliability**: Ensures all database operations are wrapped in `transaction.atomic`.

### 2. Audit Engine (`AuditService`)
A platform-wide logging system that tracks every change to the domain state.
- **Pattern**: Uses Django's `ContentType` for generic polymorphic relations.
- **Storage**: Changes are stored as JSON diffs in the `AuditEntry` model.
- **Access**: Invoked by the `AuditMixin` (see [Foundational Behaviors](foundational_behaviors.md)).

---

## 🧬 System Modularity

### Dynamic App Discovery
The project uses an "Auto-Registration" pattern managed by `core/admin/utils/discovery.py`.
- **Scan Phase**: The system scans the `apps/` and `core/` directories for valid Django apps.
- **Disable Signal**: Any directory containing a `.disable` file is automatically ignored, allowing for rapid feature toggling at the filesystem level.

---

## 🚦 Operational Orchestration

### Nexus Test Dashboard
A custom administrative interface (`test_dashboard.html`) allows developers to orchestrate the platform's health checks and test suites.
- **Dashboard View**: Dynamically populated by the `SystemModule` registry.
- **Execution Service**: The `TestRunnerService` triggers `pytest` runs and parses the results in real-time.

---

## 🔐 System Governance Models

The following models are managed within the admin tier as they are globally scoped:
- **`Company` / `Division`**: The root of the multi-tenant hierarchy.
- **`Subscription`**: Defines which "Features" are available to a specific company.
- **`TestRun`**: Historical records of platform health checks.

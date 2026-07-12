# 🗝️ Permission Registry

The Permission Registry is the heart of the platform's security and SaaS feature scoping. It ensures that every action is audited, authorized, and aligned with subscription limits.

## 1. The Tripartite Key: System:Module:Feature

To ensure scalability, the platform organizes its features into a three-tier hierarchy:
- **System**: Top-level container (e.g., `hrms`, `operations`).
- **Module**: Functional grouping within a system (e.g., `employee`, `inventory`).
- **Feature**: The granular unit of authorization (e.g., `profile`, `stock_tracking`).

This hierarchy is defined in a developer-led configuration file: `core/base_models/configs/modules.yaml`.

---

## 2. Source of Truth: Hybrid Registry

The system employs a "Developer-First, Admin-Second" strategy for its registry.

1. **`modules.yaml`**: Developers define the high-level architecture here. It’s easy to read, version-controlled, and supports bulk edits.
2. **Database Models**: During system startup or via a management command, the YAML is synchronized into the database (`SystemModule`, `SystemFeature`, `FeatureDependency`).
3. **Relational Integrity**: Once in the database, permissions are enforced through strict ForeignKeys, preventing "Ghost Permissions" or invalid assignments.

---

## 3. SaaS Scoping (Division Catalogs)

In a multi-tenant environment, the platform uses **Catalogs** to restrict features based on subscription tier.

- **`DivisionCatalog`**: A whitelist of `SystemFeature` objects allowed for a specific division.
- **Assignment-Time Enforcement**: When a user is assigned a role or permission, the registry checks it against the Division's catalog.
- **Auto-Discard**: If any assigned permission is not in the catalog, it is automatically discarded during the `m2m_changed` signal, ensuring the system remains "Secure by Subscription."

---

## 4. Performance & Caching

Authorization is a high-frequency operation. To achieve O(1) performance:
- **Manifest Compilation**: On login or permission change, the system compiles the user's effective permissions into a `frozenset`.
- **Redis Cache**: This manifest is stored in Redis.
- **Zero-Latency Checks**: Subsequent checks retrieve the manifest from the cache, providing instant authorization without querying multiple relational tables.

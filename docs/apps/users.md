# 👤 Users Domain

The `users` app manages the platform's identity, authentication, and high-level role assignments.

## 🏗️ Core Models

### `UserModel`
- **Purpose**: The primary identity entity.
- **Foundational Integration**: Inherits from `BaseModel`, providing automated auditing and versioning.
- **Validation**: Enforces strict unique constraints on email and username via `UniqueRule`.

### `Profile`
- **Purpose**: Metadata and preferences for the user.
- **Relation**: One-to-One with `UserModel`.

---

## 🔐 Security Integration

The `users` app is the primary consumer of the `core.base_models.permissions` system.

1. **Permission Assignment**: Users are assigned permissions through Many-to-Many relationships to the `Permission` model.
2. **Role Assignments**: Roles act as templates for permissions.
3. **Manifest Generation**: The `users` app provides the logic for compiling a user's permissions into the Redis-cached manifest used by the `CustomPermissionClass`.

---

## 🚦 Key Services

- **`AuthService`**: Handles login, JWT generation, and 2FA orchestration.
- **`IdentitySyncService`**: Ensures that user data is synchronized across divisions where required.

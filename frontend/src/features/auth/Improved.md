# Frontend Authentication and Permissions Architecture (Improved Version)

## 1. Overview

This document defines a **scalable, modular, and testable architecture** for handling authentication and permission management in frontend applications using **TypeScript**, **React**, and modern design patterns.

The architecture separates concerns clearly:

- **Authentication** – Handles user login, session management, and advanced authentication flows (OTP, MFA).
- **Permissions** – Handles authorization checks based on server-provided permission keys.

Both layers are **stateless, interface-driven, and extendable**, following **SOLID principles** and **Gang of Four design patterns**.

---

## 2. Authentication Layer

### 2.1 Interfaces

#### `IAuthClass` (Base Interface)

Defines the minimal authentication contract:

```ts
export interface IAuthClass {
  isAuthenticated(): boolean;
  getUser(): AuthUser | null;
  getAccessToken(): string | null;
  getRefreshToken(): string | null;

  login(credentials: {
    username: string;
    password: string;
  }): Promise<AuthTokens>;
  logout(): void;

  saveTokens(tokens: AuthTokens): void;
  clearTokens(): void;
  decodeToken<T = any>(token: string): T | null;
  loadUserFromStorage(): void;

  // Error handling hooks
  onAuthError?(error: AuthError): void;
  onTokenExpired?(): void;
}
```

#### `IAuthService` (Extended Interface)

Extends `IAuthClass` for **advanced authentication flows**:

```ts
export interface IAuthService extends IAuthClass {
  // OTP flows
  sendOtp(params: {
    email?: string;
    phone?: string;
  }): Promise<{ challengeId: string }>;
  verifyOtp(params: {
    challengeId: string;
    code: string;
  }): Promise<AuthTokens | null>;

  // MFA flows
  initiateMfa(params: { userId: string }): Promise<MfaChallenge>;
  verifyMfa(params: {
    challengeId: string;
    code: string;
  }): Promise<MfaVerificationResult>;

  // Factor management
  enableMfa(factor: AuthFactorType): Promise<boolean>;
  disableMfa(factor: AuthFactorType): Promise<boolean>;

  // Token refresh and session management
  refreshToken(): Promise<AuthTokens | null>;
  scheduleAutoLogout(timeoutMs: number): void;
}
```

---

### 2.2 Design Principles

- **Strategy Pattern** – Each authentication method (Password, OTP, MFA) is interchangeable.
- **Bridge Pattern** – Separates abstraction (`IAuthClass`) from implementation (`OtpAuthService`).
- **Template Method (optional)** – `AuthBase` can provide default behaviors for shared logic.
- **SOLID Compliance**:
  - **SRP** – Base and extended responsibilities separated.
  - **ISP** – Clients only depend on methods they need.
  - **OCP** – New auth mechanisms extend interfaces without modifying existing code.
  - **DIP** – Components depend on abstractions, not concrete implementations.

- **Error Handling** – Centralized hooks (`onAuthError`, `onTokenExpired`) ensure predictable behavior for failures.

---

### 2.3 Benefits

- Stateless and modular – No frontend holds mutable auth state.
- Extensible – Supports new auth strategies easily.
- Testable – Interfaces enable easy mocking.
- Enterprise-ready – Matches patterns in Auth0, Firebase, Keycloak, AWS Cognito.
- Resilient – Token refresh and auto-logout mechanisms handle session expiration.

---

## 3. Permissions Layer

### 3.1 Interfaces and Classes

#### `IPermissionClass` (Base Interface)

```ts
export interface IPermissionClass {
  has(key: string): boolean;
  hasEvery(keys: string[]): boolean;
  hasSome(keys: string[]): boolean;

  // Supports dynamic updates
  updatePermissions(keys: string[]): void;
}
```

#### `PermissionClass` (Concrete Implementation)

- Stateless, initialized with a **set of server permission keys**.
- Implements all interface methods (`has`, `hasEvery`, `hasSome`).
- Supports **dynamic permission updates** via `updatePermissions`.

#### Context Wrappers

- `ContextPermissionClass` – Provides permissions in a React context.
- `AdministratorContextPermissionClass` – Specialized wrapper for admin-specific permissions.
- Automatically re-renders components when permissions are updated.

---

### 3.2 Design Principles

- **SOLID Compliance**:
  - **SRP** – Permission checking is decoupled from UI or auth.
  - **OCP** – Extend admin or domain-specific permissions without modifying base class.
  - **DIP** – Components depend on interface abstractions.

- Stateless and functional – Fast, purely functional permission checks.
- Dynamic updates – Supports live permission changes without page reloads.

---

## 4. Integration with React

- **Auth** and **permissions** integrate via:
  - Context Providers (`AuthProvider`, `PermissionProvider`)
  - Custom Hooks (`useAuth()`, `usePermissions()`)

- Components perform **runtime checks** without mutating state:

```tsx
const { perm } = usePermissions();
return perm.has("can_get_user") ? <UserList /> : <AccessDenied />;
```

- **Async & Dynamic Permissions Example**:

```tsx
const { perm, updatePermissions } = usePermissions();

useEffect(() => {
  fetch("/api/permissions")
    .then((res) => res.json())
    .then((keys) => {
      updatePermissions(keys);
    });
}, []);

return perm.has("can_view_dashboard") ? <Dashboard /> : <AccessDenied />;
```

---

## 5. Recommended Folder Structure

```
auth/
├─ interfaces/
│  ├─ IAuthClass.ts
│  └─ IAuthService.ts
├─ services/
│  ├─ BaseAuthService.ts
│  ├─ OtpAuthService.ts
│  └─ MfaAuthService.ts
├─ hooks/
│  └─ useAuth.ts
├─ types/
│  ├─ AuthUser.ts
│  └─ AuthTokens.ts
├─ tests/
│  └─ AuthService.test.ts
└─ index.ts

permissions/
├─ IPermissionClass.ts
├─ PermissionClass.ts
├─ ContextPermissionClass.ts
├─ AdministratorContextPermissionClass.ts
├─ tests/
│  └─ PermissionClass.test.ts
└─ index.ts
```

---

## 6. Security Notes

- Always use **secure token storage** (HttpOnly cookies, secure local storage).
- Use **JWT libraries** (e.g., `jwt-decode`) for decoding tokens safely.
- Never expose OTP codes or MFA secrets in the frontend.
- Implement **token refresh, session expiration, and auto-logout handling**.
- Protect against **XSS and CSRF attacks** when using tokens.
- Implement **token revocation strategies server-side** to invalidate compromised tokens.
- Avoid storing sensitive secrets in the frontend.

---

## 7. Key Advantages

- Textbook-level architecture: SOLID + GoF + Clean Architecture principles.
- Stateless and interface-driven: Promotes maintainability and testability.
- Extensible: Add new auth flows or permission domains easily.
- Enterprise-ready: Compatible with large React/Next.js applications and open-source SDK patterns.
- Resilient: Handles token expiration, dynamic permission updates, and session management securely.

---

This version is **fully markdown-formatted, ready for documentation**, and includes all improvements for **production-ready, enterprise-grade frontend authentication and permissions architecture**.

---

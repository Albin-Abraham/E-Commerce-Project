# ADR 0005: API Communication Layer Architecture

## Status

**Proposed**

## Date

**2025-11-06**

---

## Context

The frontend needs a **consistent, domain-driven, and scalable API communication layer** to interact with backend services.

Requirements:

- Centralized API client with request/response interceptors.
- Typed requests and responses (TypeScript).
- Domain-based service separation (User, Billing, Roles, etc.).
- Error handling, retries, and response normalization.
- Easy integration with **React Query**, **Zustand**, or other state management.
- Support for **environment switching** (dev, staging, production).
- Maintainable and testable structure for multiple domains.

Without a standardized API layer:

- Duplicate fetch logic across components.
- Inconsistent error handling.
- Hard-to-refactor code when backend changes.

---

## Decision

Adopt a **centralized `apiClient`** + **domain service modules** architecture.

### 📁 Folder Structure

```text
src/
├─ services/
│   ├─ apiClient.ts          # Axios/Fetch wrapper with interceptors
│   ├─ interceptors/         # Request/response interceptors
│   │   ├─ authInterceptor.ts
│   │   ├─ errorInterceptor.ts
│   │   └─ loggerInterceptor.ts
│   ├─ user/                 # Domain-specific service
│   │   └─ userService.ts    # CRUD operations & typed API methods
│   ├─ billing/
│   │   └─ billingService.ts
│   ├─ admin/
│   │   └─ adminService.ts
│   └─ index.ts              # Optional aggregator of all services
```

---

### Central `apiClient.ts`

- A **singleton Axios or Fetch wrapper**.
- Configured with:
  - Base URL per environment.
  - Common headers (Authorization, Content-Type, etc.).
  - Request & response interceptors.
  - Error normalization.

- Supports **typed generics** for requests/responses.

**Example pattern (Axios + TypeScript):**

```ts
import axios, { AxiosInstance } from "axios";

import { AuthStore } from "@/stores/authStore";

const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Request interceptor
apiClient.interceptors.request.use((config) => {
  const token = AuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Centralized error handling
    if (error.response?.status === 401) {
      AuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

### Domain Service Modules

- Each **feature/domain** has its own service module.
- Services use `apiClient` internally.
- Encapsulate all API calls for the domain (CRUD + custom endpoints).
- Optional **singleton export** pattern to avoid multiple instances.

**Example: `userService.ts`**

````ts
import apiClient from "../apiClient";
import { User, CreateUserPayload } from "@/types/user";

export const userService = {
  getAll: async (): Promise<User[]> => {
    const response = await apiClient.get("/users");
    return response.data;
  },

  get: async (id: string): Promise<User> => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  create: async (payload: CreateUserPayload): Promise<User> => {
    const response = await apiClient.post("/users", payload);
    return response.data;
  },

  update: async (id: string, payload: Partial<User>): Promise<User> => {
    const response = await apiClient.put(`/users/${id}`, payload);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
* This ensures **consistency, type safety, and centralized error handling**.

---

### Modernized Error Handling & Registry
We use a centralized **Error Registry** to map API error codes to user-friendly messages.

- **`ErrorParser`**: Located in `ResponseFactory`, it parses `HttpError` instances into structured categories:
    - **`fieldErrors`**: Validation errors mapped to specific form fields.
    - **`nonFieldErrors`**: Global errors (e.g., "Invalid credentials").
    - **`crossFieldErrors`**: Errors involving multiple fields (e.g., "Passwords must match").
- **`ErrorMessages` Registry**: Supports dynamic payloads (e.g., "Password must be at least ${min} characters").

---

### Response Transformation (Wrap & UnWrap)
To avoid "endless" DTOs and one-time mappers, we use standardized factory helpers:

- **`UnWrap<T, R>(response, transformer?)`**: Used in the **Service Layer** to extract domain data and normalize shapes (e.g., extracting `id` from nested objects or handling both single objects and arrays).
- **`Wrap<T, R>(data, transformer?)`**: Used in the **Service Layer** to format request bodies for backend compatibility.

> [!IMPORTANT]
> **Governance Rule**: Interceptors handle **Global Normalization** (system errors, auth), while Services/Hooks handle **Domain Transformation** via `Wrap` and `UnWrap`.

---

### API Resilience & Performance
To prevent hanging requests and UI crashes:

- **Supervised Timeouts**: All requests must implement a timeout (default 5s). Requests exceeding this throw a `408 Timeout`.
- **Reactive Windowing (Debounce)**: High-frequency state updates that trigger re-validations are batched into a **50ms window** to prevent redundant API calls.
- **Abort Signaling**: All services must pass the `AbortSignal` to the `apiClient` to ensure stale requests are cancelled instantly.

---

### Error Handling & Response Normalization

* Centralize error mapping in `interceptors/errorInterceptor.ts`.
* Normalize error shape for UI consumption:

```ts
export interface ApiError {
  status: number;
  message: string;
  details?: any;
}

export function mapError(error: any): ApiError {
  return {
    status: error.response?.status || 500,
    message: error.response?.data?.message || error.message,
    details: error.response?.data?.errors || null,
  };
}
````

- All UI code should **handle errors via this normalized structure**.

---

### Integration with React Query / State

- Services return **typed Promises**, ideal for React Query:

```ts
import { useQuery } from "@tanstack/react-query";

import { userService } from "@/services/user/userService";

export const useUsers = () => {
  return useQuery(["users"], userService.getAll);
};
```

- Local state or global Zustand stores can also consume these service methods directly.

---

### Rationale

- **Centralized client** ensures consistent headers, auth, and error handling.
- **Domain services** keep each feature encapsulated.
- **Typed API contracts** improve code reliability and maintainability.
- Facilitates **lazy-loading**, **unit testing**, and **mocking**.
- Aligns with **ADR 0004 modular folder structure**.

---

### Alternatives Considered

| Approach                         | Description                                 | Reason Rejected                                         |
| -------------------------------- | ------------------------------------------- | ------------------------------------------------------- |
| Global fetch/axios in components | Components call Axios directly              | Leads to duplicated logic, inconsistent error handling. |
| One massive service module       | Single `services.ts` for all domains        | Hard to scale; violates modularity.                     |
| Class-based services             | Create service classes with `new` instances | Overhead; singleton export simpler for current scope.   |

---

### Consequences

**Positive:**

- ✅ Standardized API communication layer.
- ✅ Easy mocking and testing.
- ✅ Strong type safety and autocompletion.
- ✅ Aligned with domain-driven architecture.

**Negative:**

- ⚙️ Initial setup requires discipline and boilerplate.
- ⚙️ Teams must follow conventions to prevent cross-domain service imports.

---

### Governance Rules

- **All API calls go through domain services**, never directly from components.
- **apiClient** is the only Axios/Fetch instance.
- Services must return **typed promises**.
- Interceptors handle auth tokens and common error cases.
- Domain services may be singletons (`export const userService = { ... }`) unless class instance required.
- Services are **side-effect free**, except for API communication.

---

### References

- [Axios Interceptors Guide](https://axios-http.com/docs/interceptors)
- [React Query API Patterns](https://tanstack.com/query/latest)
- [TypeScript + Axios Best Practices](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- [Feature-Sliced Design: API Services](https://feature-sliced.design/docs/get-started/overview)

---

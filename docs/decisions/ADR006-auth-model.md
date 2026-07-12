# **ADR-006: Authentication & Authorization Model**

**Status:** Proposed → Accepted
**Date:** 2025-11-11
**Decision Type:** Security / Identity

---

## 1. Context

The application serves internal web UIs, REST APIs consumed by frontends and third parties, and potentially mobile clients. We need an authentication and authorization approach covering web sessions, token-based API auth, RBAC (roles & permissions), and extensibility for OAuth2 / SSO.

Options:

* Use Django sessions + custom RBAC
* Use Django + Django REST Framework token auth (simple tokens)
* Use OAuth2 / OpenID Connect (OIDC) for SSO + JWT for APIs
* Roll-your-own auth system

---

## 2. Decision

Adopt **hybrid identity**:

* **Primary authentication:** OAuth2 / OpenID Connect (OIDC) as the canonical identity provider for staff and external clients (support external SSO providers).
* **Web UI:** OIDC-backed sessions (short-lived session cookies).
* **API:** Use **short-lived JWT access tokens** issued by the OIDC provider and **refresh tokens** (rotating refresh tokens).
* **Authorization:** Role-Based Access Control (RBAC) with fine-grained permissions stored in the application (roles → permissions). Support attribute-based checks (ABAC) for advanced rules. Centralize permission logic in domain apps or `core/permissions`.
* **Admin & service accounts:** Machine/service accounts with client credentials grant (OAuth2) and scoped access.
* **Fallback:** For simple internal scripts, use service tokens with tight TTL and audit logging.

---

## 3. Rationale

* **Security best-practices:** OIDC + JWT is standard, supports SSO, and enables federated identity.
* **Scalability:** Token-based auth scales across services and mobile clients.
* **Flexibility:** Supports external identity providers (Okta, Keycloak, Azure AD) and future SSO requirements.
* **Separation of concerns:** Authentication (who you are) handled by IdP; authorization (what you can do) handled by the app.
* **Auditing & rotations:** Centralized token handling and rotation policies improve security.

---

## 4. Consequences

### Positive

* Improved security posture and SSO compatibility.
* Clear separation of authn/authz responsibilities.
* Better support for multi-client types (web, mobile, API).

### Negative

* Increased initial setup (IdP integration, token handling).
* Need to manage token lifecycles, revocation/invalidation strategies, and safe storage of refresh tokens.

---

## 5. Alternatives Considered

### Simple token auth or Django sessions only

Rejected → insufficient for external integrations, SSO, and scaling.

### Roll-your-own OAuth2

Rejected → high security risk; prefer proven IdP or open-source providers.

---

## 6. Implementation Plan

1. Select an IdP (e.g., Keycloak, Auth0, corporate IdP) and configure OIDC.
2. Implement OIDC client in Django (e.g., `mozilla-django-oidc`, or custom integration).
3. Use JWT verification middleware for APIs; store token introspection / revocation logic.
4. Implement RBAC primitives in `core/permissions` and decorate views/DRF viewsets with permission checks.
5. Document flows: user login, token refresh, client credentials for machines.
6. Add audit logging for authentication events and token usage.

---

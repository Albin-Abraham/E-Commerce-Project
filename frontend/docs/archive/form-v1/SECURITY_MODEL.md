# Security Model Specification

This document defines the threat model, trust boundaries, and security controls for the Form Engine in multi-tenant SaaS environments.

---

## 1. Threat Model

### Assets to Protect
| Asset | Classification | Impact if Compromised |
|-------|----------------|----------------------|
| Form Data (PII, financial, health) | Confidential | Regulatory fines, reputation loss |
| Tenant Configuration | Confidential | Cross-tenant data leakage |
| User Credentials/Session | Critical | Account takeover |
| Backend API Access | Critical | Unauthorized data access |
| Form Schema/Logic | Proprietary | IP theft, logic manipulation |

### Threat Actors
| Actor | Capabilities | Motivation |
|-------|--------------|------------|
| External Attacker | Network, XSS, injection | Data theft, disruption |
| Malicious Tenant Admin | Schema authoring, action registration | Cross-tenant access, privilege escalation |
| Compromised User | Valid session, form interaction | Data exfiltration, privilege escalation |
| Supply Chain | NPM dependencies, build pipeline | RCE, data theft |

### Attack Surface
1. **Schema Authoring** (EntityDefinition/Contract API) - Tenant-controlled
2. **Expression Evaluation** - Runtime expression engine
3. **Action Execution** - String-based action dispatch
4. **Remote Options** - HTTP requests to external APIs
5. **Middleware** - Custom async code in pipeline
6. **File Upload** - User-supplied files

---

## 2. Trust Boundaries

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PLATFORM TRUST BOUNDARY                       │
│  ┌─────────────────────┐  ┌─────────────────────┐                  │
│  │   CONTROL PLANE     │  │   DATA PLANE        │                  │
│  │  (Platform Admins)  │  │  (Tenant Admins)    │                  │
│  ├─────────────────────┤  ├─────────────────────┤                  │
│  │ • Engine code       │  │ • Form schemas      │                  │
│  │ • Core modules      │  │ • Expressions       │                  │
│  │ • Registry          │  │ • Action handlers   │                  │
│  │ • Infra             │  │ • Middleware        │                  │
│  └─────────────────────┘  └─────────────────────┘                  │
│         │                        │                                   │
│         ▼                        ▼                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    EXECUTION SANDBOX                         │   │
│  │  • Expression Engine (no eval/Function)                     │   │
│  │  • Action Registry (capability-based)                       │   │
│  │  • Remote Options (allowlisted domains)                     │   │
│  │  • Middleware (timeout, resource limits)                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Boundary Rules
| Boundary | Rule |
|----------|------|
| Control → Data Plane | One-way: platform deploys, tenants configure |
| Schema → Engine | Schema validated at compile time, no runtime code |
| Expressions → Engine | Sandboxed evaluator, allowlisted functions only |
| Actions → Backend | Capability tokens, tenant-scoped |
| Remote Options → External | Allowlisted domains, tenant-scoped proxies |

---

## 3. Expression Engine Security

### Sandbox Design
The `ExpressionEngine` uses a **custom parser** — no `eval()`, `Function()`, or `new Function()`.

**Allowed Operations**:
- Property access: `user.name`, `form.values.field`
- Comparisons: `===`, `!==`, `>`, `<`, `>=`, `<=`
- Logical: `&&`, `||`, `!`
- Ternary: `condition ? true : false`
- Allowlisted functions: `today()`, `sum()`, `uppercase()`, `lowercase()`, `currency()`, `hasrole()`

**Explicitly Blocked**:
```typescript
// These patterns are rejected at compile time (IR Validator)
eval(/* anything */)
Function(/* anything */)
require(/* anything */)
import(/* anything */)
process.env
globalThis
__proto__
constructor.prototype
Object.defineProperty
Object.setPrototypeOf
```

### Expression Context
```typescript
interface ExpressionContext {
  values: Record<string, any>;      // Form values ONLY
  user?: {                          // Scoped user info
    id?: string;
    name?: string;
    role?: string;
    roles?: string[];               // For hasrole()
  };
  context?: Record<string, any>;    // Platform-provided only
}
```

**Tenant Isolation**: `context` is populated by platform, not tenant schemas.

### Compile-Time Validation
IR Validator rejects schemas containing:
- Function callbacks in `visible`/`enabled`/`computed`
- Dangerous patterns in condition expressions
- Disallowed function references

### Runtime Guards
- Max expression depth: 10 (configurable via `security.maxExpressionDepth`)
- Max evaluation time: 50ms (via async timeout)
- No access to `window`, `document`, `localStorage`, `fetch`

---

## 4. Action Execution Security

### Capability-Based Model
Actions are **capabilities**, not strings:

```typescript
// Platform registers capabilities
actionRegistry.register("form.submit", {
  capability: "form:submit",
  handler: submitHandler,
  requiredScopes: ["forms:write"],
});

// Tenant schema declares intent (not implementation)
{
  type: "button",
  properties: {
    action: "form.submit",  // Capability reference
  }
}
```

### Action Registry
```typescript
interface ActionCapability {
  id: string;
  capability: string;           // e.g., "form:submit", "api:users.read"
  handler: (payload, context) => Promise<any>;
  requiredScopes: string[];     // OAuth2-style scopes
  tenantScopes?: string[];      // Tenant-specific restrictions
  rateLimit?: { max: number; windowMs: number };
  timeoutMs?: number;
}
```

### Execution Flow
```
Button Click
    │
    ▼
ActionContext.executeAction("form.submit", payload)
    │
    ▼
1. Lookup capability in registry
2. Verify tenant has requiredScopes
3. Verify rate limit
4. Execute handler with timeout
5. Return result or error
```

### Security Properties
| Property | Enforcement |
|----------|-------------|
| No arbitrary code | Handlers registered by platform only |
| Tenant isolation | `tenantScopes` restricts cross-tenant access |
| Rate limiting | Per-capability, per-tenant |
| Timeout | Configurable per capability (default 30s) |
| Audit logging | All executions logged with tenant/user/context |

---

## 5. Remote Options Security

### Allowlist Model
```typescript
interface RemoteOptionsConfig {
  url: string;                    // Must match allowlist pattern
  allowlist: string[];            // e.g., ["https://api.tenant.com/*"]
  method: "GET" | "POST";
  headers: Record<string, string>; // No Authorization header allowed from schema
  watch: string[];                // Field names only
  debounceMs: number;             // Min 100ms
  cacheTTL: number;               // Max 3600s
  mapping: {                      // Output transformation only
    valuePath: string;
    labelPath: string;
  };
}
```

### Request Flow
```
Field Change (watched)
    │
    ▼
Debounce (min 100ms)
    │
    ▼
Cache Check (TTL)
    │
    ├── Hit → Return cached
    │
    └── Miss → Proxy Request
              │
              ▼
         Platform Proxy
              │
              ▼
         Target API (allowlisted domain)
              │
              ▼
         Transform Response (mapping only)
              │
              ▼
         Update ViewState (loading/options)
```

### Security Controls
| Control | Implementation |
|---------|----------------|
| Domain allowlist | Compile-time validation, runtime enforcement |
| No auth headers from schema | Platform injects auth via proxy |
| Request sanitization | Only `watch` fields sent as params |
| Response transformation | Only `mapping` paths extracted |
| Caching | Prevents amplification attacks |
| Rate limiting | Per-field, per-tenant (default 60/min) |

---

## 6. Middleware Security

### Sandbox Constraints
```typescript
interface MiddlewareContext {
  form: FormCore;           // Read-only proxy
  fieldId: string;
  // No: setTimeout, setInterval, fetch, eval, require
  // No: access to global scope
}
```

### Resource Limits
| Resource | Limit | Enforcement |
|----------|-------|-------------|
| Execution time | 5s | Async timeout wrapper |
| Memory | 50MB | Worker thread (future) |
| Nested setValue depth | 5 | Cycle guard |
| Concurrent middleware | 10 | Queue with backpressure |

### Prohibited Operations
- `fetch`, `XMLHttpRequest`, `WebSocket`
- `setTimeout`, `setInterval` (use platform scheduler)
- `eval`, `Function`, dynamic imports
- DOM access
- `localStorage`, `sessionStorage`, `IndexedDB`

### Tenant Middleware Registration
```typescript
// Platform validates at registration
form.use(async ({ form, fieldId }) => {
  // form is read-only proxy
  // Only allowed: form.values.get(), form.setValue() on OTHER fields
  // Not allowed: form.submit(), form.destroy(), form.setValue() on same field
});
```

---

## 6. Schema Validation (Compile-Time)

### IR Validator Security Checks
The `validateIR()` function enforces:

```typescript
// 1. No function callbacks in schema
if (typeof field.visible === "function") → ERROR

// 2. No dangerous expression patterns
if (expr.includes("eval(")) → ERROR
if (expr.includes("Function(")) → ERROR
if (expr.includes("require(")) → ERROR
if (expr.includes("process.env")) → ERROR

// 3. Allowed functions only
if (security.allowedExpressionFunctions.includes(fn)) → OK
else → ERROR

// 4. Expression depth limit
if (exprDepth > security.maxExpressionDepth) → ERROR

// 5. Action registration required
if (security.requireActionRegistration && actionNotRegistered) → ERROR

// 6. Tenant isolation
if (security.tenantIsolation && crossTenantRef) → ERROR
```

### Schema Migration
Legacy schemas with function callbacks:
```typescript
// BEFORE (rejected)
visible: (values) => values.role === "admin"

// AFTER (allowed)
visible: "form.values.role === 'admin'"
```

---

## 7. File Upload Security

### Validation Pipeline
```
File Selected
    │
    ▼
Client-side: type/size check (UX only)
    │
    ▼
Upload to Platform Storage (signed URL)
    │
    ▼
Server-side:
  - MIME type verification (magic bytes)
  - Size limit enforcement
  - Virus scan (async)
  - Content-type validation
    │
    ▼
Reference stored in form (fileId, not blob)
```

### Schema Config
```typescript
{
  type: "file",
  properties: {
    accept: "image/*,application/pdf",  // MIME allowlist
    maxSize: 5_000_000,                 // 5MB max
    multiple: false,
  }
}
```

---

## 8. Multi-Tenant Isolation

### Data Scoping
```typescript
// All form operations scoped to tenant
interface TenantContext {
  tenantId: string;
  userId: string;
  roles: string[];
  permissions: string[];
  dataScope: "own" | "team" | "org" | "all";
}
```

### Enforcement Points
| Operation | Isolation Check |
|-----------|-----------------|
| Form load | `tenantId` in schema metadata |
| Remote options | Proxy adds `tenantId` header |
| Action execution | Capability `tenantScopes` |
| Data submission | Backend validates ownership |
| File upload | Storage path includes `tenantId` |

### Cross-Tenant Prevention
- Schema cannot reference other tenant's data
- Remote options cannot target other tenant's APIs
- Actions cannot escalate to platform capabilities
- Expressions cannot access `context.otherTenants`

---

## 9. Audit & Compliance

### Audit Log Events
| Event | Fields |
|-------|--------|
| `form.loaded` | tenantId, formId, userId, timestamp |
| `form.submitted` | tenantId, formId, userId, dataHash, timestamp |
| `action.executed` | tenantId, actionId, userId, payloadHash, result, duration |
| `remote.fetch` | tenantId, fieldId, url, status, duration |
| `middleware.executed` | tenantId, middlewareId, fieldId, duration |
| `security.violation` | tenantId, type, details, timestamp |

### Retention
- Audit logs: 7 years (configurable)
- Form data: Per tenant policy
- Security events: 1 year minimum

---

## 10. Incident Response

### Security Violation Types
| Type | Detection | Response |
|------|-----------|----------|
| Expression injection | IR Validator / Runtime | Block, alert, audit |
| Action privilege escalation | Capability check | Block, revoke capability, audit |
| Cross-tenant access | Tenant scope check | Block, alert, audit |
| Resource exhaustion | Rate limit / Timeout | Throttle, alert |
| Malicious file upload | Virus scan | Quarantine, alert |

### Playbook
1. **Detect** → Automated monitoring alerts
2. **Contain** → Revoke capability, disable form, block tenant
3. **Investigate** → Audit log analysis
4. **Remediate** → Patch, rotate credentials, update allowlists
5. **Report** → Compliance notification (if PII involved)

---

## 11. Secure Configuration Checklist

### Platform (Control Plane)
- [ ] Expression Engine allowlist reviewed quarterly
- [ ] Action capabilities registered with least privilege
- [ ] Remote options domain allowlist maintained
- [ ] Middleware resource limits configured
- [ ] Audit logging enabled and monitored
- [ ] TLS 1.3 for all external connections
- [ ] Secrets rotated quarterly

### Tenant (Data Plane)
- [ ] Form schemas validated via IR Validator
- [ ] No function callbacks in schema
- [ ] Remote options use allowlisted domains
- [ ] Actions reference registered capabilities only
- [ ] File uploads configured with size/type limits
- [ ] User roles mapped to `hasrole()` correctly
- [ ] Data retention policies configured

---

## 12. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-10-12 | Initial specification |

---

## Appendix: Security Config Schema

```typescript
// In CanonicalFormIR
security: {
  sanitizeOutput: true,
  allowedExpressionFunctions: [
    "today", "sum", "uppercase", "lowercase", "currency", "hasrole"
  ],
  maxExpressionDepth: 10,
  requireActionRegistration: true,
  tenantIsolation: true,
}
```
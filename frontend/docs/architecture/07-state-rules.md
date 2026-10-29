# State Ownership Architecture

> Status: Mandatory Engineering Contract
> Scope: State Management

## 1. State Ownership Rules

State MUST exist at the lowest stable ownership boundary.
Priority:

1. local component state
2. ViewModel state
3. feature reducer state
4. feature context state
5. global runtime state

Global state is reserved exclusively for:

- authentication
- themes
- runtime configuration
- session infrastructure
- platform coordination

Feature business state MUST remain localized. This prevents store chaos and enforces query cache boundaries.

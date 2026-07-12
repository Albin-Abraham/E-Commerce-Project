# 🏛️ Vertical Slice Contract Standards

To prevent the **`ServiceRegistry`** from becoming a "dumping ground" for internal module methods, every vertical slice must define a **Public Contract**.

## 🛡️ The "Contract-First" Philosophy

- **Modules are Black Boxes**: Internal models and utilities should never be exposed.
- **Interfaces over Implementation**: Only expose methods that are essential for cross-module orchestration.
- **Registration**: Only a factory-resolved instance of the Contract should be placed in the `ServiceRegistry`.

## 🏗️ Standards for Tiered Services

When a module has different behavior based on the SaaS Tier (e.g., `DefaultPayroll` vs. `AdvancedPayroll`), the contract remains the same, but the **Implementation** is injected based on the Bootstrap logic.

### Example Contract (`IPayrollService`):
```python
# apps/payroll/contracts.py
class IPayrollService(ABC):
    @abstractmethod
    def calculate_net_pay(self, employee_id, period):
        """Standard contract for net pay calculation."""
        pass

# apps/payroll/services/default_service.py
class DefaultPayrollService(IPayrollService):
    # Basic logic...

# apps/payroll/services/progressive_service.py (Step-up Plan)
class ProgressivePayrollService(IPayrollService):
    # Advanced logic (Negates and overrides Default)...
```

## 🗝️ Service Registry Mapping

| Slice | Contract Location | Exposed Methods |
| :--- | :--- | :--- |
| **Users** | `apps/users/contracts.py` | `get_user_manifest`, `validate_session` |
| **HRMS** | `apps/hrms/contracts.py` | `get_employee_details`, `get_org_chart` |
| **Payroll** | `apps/payroll/contracts.py` | `calculate_net_pay`, `sync_gl_journals` |

---

## 🚦 Integration Workflow

1.  **Bootstrap Phase**: The `SystemConfigurationMiddleware` identifies the active **SaaS Plan**.
2.  **Resolution**: The `Backtracking Solver` selects the correct **Implementation** (e.g., `ProgressivePayrollService`).
3.  **Injection**: The selected service is registered in `request.feature_registry`.
4.  **Consumption**: Other modules (e.g., Finance) access it via `request.feature_registry.get('payroll')`, unaware of whether it's the "Default" or "Upgraded" version.

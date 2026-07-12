# 👔 HRMS Domain (Human Resources Management System)

The `hrms` app is the central location for employee lifecycle management, payroll, and organizational data.

## 🏛️ Core Modules

### 👥 Employee Management
- **`Employee`**: Tracks personal information, history, and status.
- **`OrgChart`**: Hierarchical representation of the organization.
- **Validation**: Integrates with `core` to ensure that every employee has a valid, non-duplicate identity.

### 💰 Payroll & Compensation
- **`PayrollEntry`**: Records of salary processing and historical payments.
- **`SalarySlip`**: Generated documents based on payroll entries.
- **Invariants**: Payroll processing depends on the `ValidationMediator` to ensure that no empty or malformed entries are submitted to the bank.

---

## 🚦 Foundational Integration

The `hrms` app follows the "Vertical Slice" pattern and uses `core` for:
1. **Auditing**: Every employee change is tracked via `AuditMixin`.
2. **Permissions**: Scopes like `hrms:payroll:edit` allow for granular control over who can process salary data.
3. **Common Fields**: Uses `CustomCharField` and `CustomEmailField` to ensure consistent data types.

---

## ⚡ Cross-App Dependencies

- **`users`**: The HRMS app links employees to user accounts for login and identity management.
- **`core_documents`**: Employee-related documents (contracts, identification) are managed via the centralized document service.

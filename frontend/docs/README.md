# Documentation Index

Central index for the frontend documentation set. All paths are relative to `docs/`.

---

## 1. Documentation Map

| Area | Location | Contents |
|---|---|---|
| **Forms** | [`form/`](./form/README.md) | Zenith Form Architecture v2: architecture spec, quick start, 6 task guides, and the exhaustive [`form/reference/`](./form/reference/00-INDEX.md) API reference (12 files) |
| **Tables** | [`table/`](./table/README.md) | ZenithTable: `v1/` guides (selection, inline editing, URL/API sync, server-driven UI) and `v2/` layer specs |
| **Architecture rules** | [`architecture/`](./architecture/00-app-rules.md) | 14 mandatory rule files (app, route, feature, component, viewmodel, contract, communication, state, async, security, testing, performance, folder, enforcement) + `improvements.md` |
| **Architecture ADRs** | [`architecture/adr/`](./architecture/adr/ADR-001-public-contract-system.md) | Feature-contract decisions: public contract system, query ownership, feature communication |
| **Platform ADRs** | [`adr/`](./adr/001-project-setup.md) | Platform-level decisions (see §2) |
| **Testing** | [`testing/`](./testing/) | Generated test reports (`reports/`) and report templates (`templates/`) |
| **Loading** | [`loading/v1/`](./loading/v1/README.md) | Loading states: rules and anti-patterns |
| **Navigation** | [`navigation/v1/`](./navigation/v1/README.md) | Navigation/dropdowns: rules and anti-patterns |
| **Overlays** | [`overlay/v1/`](./overlay/v1/README.md) | Overlay components: rules and anti-patterns |
| **PDF** | [`pdf/v1/`](./pdf/v1/README.md) | PDF generation: getting started, schema reference, advanced usage |
| **Archive** | [`archive/form-v1/`](./archive/form-v1/README.md) | Legacy v1 MDAP form docs — historical context only, superseded by `form/` |

### Standalone documents

| Document | Purpose |
|---|---|
| [`DEVELOPMENT_GUIDELINES.md`](./DEVELOPMENT_GUIDELINES.md) | General engineering guidelines (input validation, server-side validation rules) |
| [`CODE_REVIEW_CHECKLIST.md`](./CODE_REVIEW_CHECKLIST.md) | Review checklist |
| [`DESIGN_SYSTEM_ARCHITECTURE.md`](./DESIGN_SYSTEM_ARCHITECTURE.md) | Design system overview |
| [`TableCore_Architecture_Spec.md`](./TableCore_Architecture_Spec.md) | TableCore specification (incl. §5.2 TableCore ↔ FormCore inline-editing integration) |
| [`ZENOS_ARCHITECTURE_DECISIONS.md`](./ZENOS_ARCHITECTURE_DECISIONS.md) | Compiled ZenOS platform decision record |
| [`BRANCHING_STRATEGY.md`](./BRANCHING_STRATEGY.md) · [`GIT_RESTRUCTURING_GUIDE.md`](./GIT_RESTRUCTURING_GUIDE.md) | Git workflow |
| [`CICD_README.md`](./CICD_README.md) · [`CI_CD_WORKFLOWS.md`](./CI_CD_WORKFLOWS.md) | CI/CD |

---

## 2. Platform ADR Changelog (`docs/adr/`)

| ADR | Title | Status |
|---|---|---|
| [001](./adr/001-project-setup.md) | Use React with Vite for Frontend Development | Accepted |
| [002](./adr/002-ui-framework.md) | Choose UI Framework for React Frontend Development | Proposed |
| [003](./adr/003-state-management.md) | Choose State Management Strategy for React Frontend | Proposed |
| [004](./adr/004-project-structure.md) | Folder Structure and Module Architecture for React + Vite Project | Proposed |
| [005](./adr/005-api-layer.md) | API Communication Layer Architecture | Proposed |
| [006](./adr/006-routing.md) | React Routing Strategy | Accepted |
| [007](./adr/007-zenos-architecture-evolution.md) | ZenOS Frontend Architecture Evolution (V2) | Accepted |
| [008](./adr/008-governance-standards.md) | ZenOS Architecture Governance & Scaffolding Standards | Accepted |
| [009](./adr/009-zenos-five-layer-platform-manifesto.md) | The ZenOS Five-Layer Frontend Platform Manifesto | Approved |
| [010](./adr/010-zenos-layered-architecture-governance.md) | ZenOS V2 Layered Application & Runtime Architecture | Approved |

There is a second, separate ADR set for feature contracts under [`architecture/adr/`](./architecture/adr/ADR-001-public-contract-system.md) (ADR-001–003); use `adr/` for platform decisions and `architecture/adr/` for cross-feature contract decisions.

---

## 3. Conventions

- **Branding:** "ZenOS" names the overall platform (governance, ADRs, testing doctrine). Subsystems carry their own names: the form platform is the **Zenith Form Architecture**, the table platform is **ZenithTable**.
- **Directory versioning:** current documentation lives in a flat domain folder (`form/`), while versioned domains use `<domain>/v1/` (and `table/v2/`). Superseded material moves to `archive/` with a warning banner.
- **Import aliases in examples:** forms use `@ui/form`, tables use `@shared/ui/table`, general source references use `@/…`.
- **Generated artifacts:** files under `testing/reports/` and `archive/form-v1/API_REFERENCE.md` are machine-generated; treat them as snapshots, not hand-maintained docs.

---

## 4. ADRs vs. Other Documents

| Artifact | Focus | Example |
|---|---|---|
| **ADR** | Decision + rationale | "Use React with Vite" |
| **Design Doc** | Implementation details | "Component communication strategy" |
| **RFC** | Proposal/discussion before an ADR | "Proposal for changing build tool" |
| **Architecture Overview** | System snapshot | "Frontend architecture diagram" |

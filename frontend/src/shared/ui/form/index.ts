/**
 * @file index.ts
 * @description ZenOS Form Ecosystem — Public Modular API Surface
 *
 * Clean Architecture Separation:
 *  1. Forms Runtime & Orchestration (Form, FormRenderer, FormComposer, DetailRenderer)
 *  2. Field Components & Atoms (ButtonField, RadioGroup, CodeInputField, TextField, SwitchField, etc.)
 *  3. Structural Components (FieldShell, InputWrapper, OuterWrapper, CardField, TabsField)
 *  4. Autonomous Wrapped Fields (Tier 4 pre-composed fields)
 *  5. Form Hooks & Reactive State
 *  6. Form Contexts & Dependency Injection Providers
 *  7. Domain Schemas, Contracts & Metadata
 */

// ── Manifests ───────────────────────────────────────────────────────────────
import "./manifest/default-manifests";

// ── 1. Forms Runtime & Orchestration (Forms) ────────────────────────────────
export { Form } from "./Form";
export type { FormProps, FormHandle } from "./FormProps";
export { FormRenderer, RenderNode, RenderChild } from "./FormRenderer";
export type { FormRendererProps } from "./FormRenderer";
export { FormComposer } from "./FormComposer";
export { FieldRenderer } from "./FieldRenderer";
export { FieldRouter } from "./FieldRouter";

// Form-level UI & Shell Components (@form-ui)
export * from "./components";

// Canonical Form IR (Unified Compilation Pipeline)
export { compileToIR, IRToFormDefinition } from "./utils/ir-compiler";
export { validateIR } from "./utils/ir-validator";
export type {
  CanonicalFormIR,
  IRField,
  IRSection,
  IRValidationResult,
  CompilationResult,
} from "./types/ir";
export { ExpressionEngine } from "@form-core/expression-engine";
export type { ExpressionContext } from "@form-core/expression-engine";

// Detail Page Presentation Runtime
export * from "./detail";

// ── 2. Field Components & Input Atoms (btn, radio, codeinput, etc.) ─────────
// Tier 1 & Tier 2: Primitive Input Atoms & Static Fields
export * from "./fields/primitive";

// ── 3. Structural Field Components & Wrapper Trinity ─────────────────────────
// Tier 3: Layout Groups & Container Surfaces
export * from "./fields/structure";

// Wrapper Trinity (FieldShell, InputWrapper, OuterWrapper, FieldLabel, FieldFeedback)
export * from "./structure";

// ── 4. Autonomous Wrapped Fields (Tier 4) ───────────────────────────────────
export * from "./fields/wrapped-fields";
export { withAtom, withFieldShell } from "./hoc/withAtom";
export { withViewModel } from "./hoc/withViewModel";

// ── 5. Form Hooks & Reactive State ──────────────────────────────────────────
export * from "./hooks";

// ── 6. Form Contexts & Providers ────────────────────────────────────────────
export * from "./context";

// ── 7. Domain Types, Schemas & Contracts ────────────────────────────────────
export * from "./types";
export * from "./fields";

// ── 8. Form Registries & Builder ────────────────────────────────────────────
export {
  createSplitRegistry,
  createDefaultRegistry,
  createMinimalRegistry,
  preloadFieldTypes,
  defaultRegistry,
} from "./fields/lazy-registry-builder";
export { RegistryStore, LazyRegistryStore } from "./registry";
export type { FieldDefinition } from "./registry";
export { FormBuilder } from "./builder";

// ── 9. Form Adapters & Styling ──────────────────────────────────────────────
export type {
  StyleAdapter,
  FieldStyleSlots,
  ShellStyleSlots,
  SectionStyleSlots,
  ActionStyleSlots,
} from "./styles/style-adapter";
export {
  TailwindAdapter,
  defaultTailwindAdapter,
} from "./styles/tailwind-adapter";
export { SassAdapter, defaultSassAdapter } from "./styles/sass-adapter";

// ── 10. Platform Features, Utilities & Resilience ───────────────────────────
export {
  CircuitBreaker,
  formCircuitBreaker,
  type BreakerState,
  type BreakerEntry,
  type CircuitBreakerOptions,
} from "@form-core/modules/circuit-breaker";
export { FormHistory, type HistorySnapshot, type HistoryOptions } from "@form-core/modules/history";
export {
  createPersistenceMiddleware,
  recoverDraft,
  clearDraft,
  getDraftMeta,
  type FormDraft,
  type PersistenceConfig,
} from "./utils/form-persistence";
export {
  SSRSafe,
  isSSR,
  isClient,
  isMotionSupported,
  createMotionWrapper,
  BROWSER_ONLY_FIELD_TYPES,
} from "./utils/ssr-compat";
export {
  enhanceFieldProps,
  createAnnouncement,
  focusFirstInvalidField,
} from "./utils/accessibility-runtime";
export {
  createFocusTrap,
  getFocusableElements,
  focusFirstFocusable,
} from "./utils/focus-trap";
export * from "./utils/MetaSchemaBridge";
export { fuseSchema, normalizeUIConfig, type UIConfiguration } from "./utils/schema-fusion";
export { createFormDefinition, createSchemaFactory } from "./utils/schema-factory";
export { compileEntityToFormDef, compileEntityToIR, validateEntityDefinition } from "./utils/mdap-compiler";
export { compileContractToIR, validateContract } from "./types/contract";
export { createSimpleForm, type SimpleFormOptions, type SimpleFormField } from "./utils/createSimpleForm";
export { BackendMetadataNormalizer, type BackendFieldMetadata, type BackendSchemaMetadata } from "@form-core/backend-normalizer";
export { UIPrimitiveAdapter, type PrimitiveInputProps, type PrimitiveSelectProps, type PrimitiveComponentRegistry } from "./adapters/primitives";
export { PrintDocumentRenderer, type PrintDocumentRendererProps } from "./surfaces/PrintDocumentRenderer";
export { ModalShell } from "./shell/ModalShell";
export type { FormSurfaceShell, FormSurfaceShellProps } from "./shell/surface-shell";
export { Modal, Overlay, useModal, type ModalProps, type ModalHeaderProps, type ModalBodyProps, type ModalFooterProps, type ModalCloseProps } from "@ui/overlay";

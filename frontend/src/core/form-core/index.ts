// Main Facade (React-ready)
export { Form, ReactFormAdapter } from "./form";
export type { FormCoreOptions, ValidationMode } from "./engine";
export type { IFormCore } from "./form-interface";

// Engine (headless, framework-agnostic)
export { FormCore } from "./engine";
export type {
  InternalFormState,
  NormalizedForm,
  ValuesState,
  ValidityState,
  VisibilityState,
  ViewState,
  VitalityState,
  DetailedError,
  SectionEntity,
  FieldEntity,
} from "./engine";
export type { UIState, BusinessState } from "./int-types";

export { normalizeFormDefinition, denormalizeForm } from "./engine";

// Registries (Schema & Domain Metadata)
export { SchemaRegistry, schemaRegistry } from "./SchemaRegistry";
export { ManifestRegistry, manifestRegistry } from "./ManifestRegistry";
export { ValidationRegistry, registerValidationStrategy } from "./validation-registry";
export { ConditionRegistry, conditionRegistry } from "./condition-registry";
export { InjectionRegistry, injectionRegistry } from "./injection-registry";

// Validation
export type { ValidationAdapter } from "./validation-adapter";
export { ValidationProxy } from "./validation-proxy";
export type { ValidationMessageConfig } from "./validation-proxy";

// Backend Normalizer
export { BackendMetadataNormalizer } from "./backend-normalizer";
export type { BackendFieldMetadata, BackendSchemaMetadata } from "./backend-normalizer";

// Hardened Expression Engine
export {
  ExpressionEngine,
  DEFAULT_EXPRESSION_CONFIG,
  ExpressionSecurityError,
  ExpressionEvaluationError,
} from "./expression-engine";
export type {
  ExpressionContext,
  ExpressionEngineConfig,
} from "./expression-engine";

// Modules (advanced module access)
export * from "./modules";

// Validation Adapters (Zod & Pluggable Adapters)
export * from "./adapters";

// Domain Entities, Formatters & Adapters
export * from "./domain";

// Schema Migration & Version Transformers
export * from "./transformers/schema-migrator";

// Event-Sourced Time-Travel & Telemetry Replay
export * from "./modules/time-travel";


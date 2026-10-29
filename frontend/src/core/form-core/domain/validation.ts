import type { ConditionExpression } from "./condition";

// Extension point: consumers augment this via declaration merging.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CustomValidationTypes {}

/** Single field validation rule */
export interface ValidationRule {
  type:
    | "required"
    | "min"
    | "max"
    | "minLength"
    | "maxLength"
    | "pattern"
    | "email"
    | "url"
    | "phone"
    | "date"
    | "time"
    | "creditCard"
    | "uuid"
    | "fileSize"
    | "fileType"
    | "alphanumeric"
    | "digitsOnly"
    | "alphaOnly"
    | "ip"
    | "postalCode"
    | "matches"
    | "match"
    | "custom"
    | keyof CustomValidationTypes;
  /** Value associated with the rule, e.g., min, maxLength */
  value?: any;
  /** Custom validation function */
  fn?: (value: any, form: Record<string, any>) => boolean | string;
  /** Message to show when validation fails */
  message?: string;
  /** Severity level */
  severity?: "error" | "warning" | "info";
  /** Optional condition to apply this validation */
  when?: ConditionExpression;
}

/** Async validation rule (e.g., API-based) */
export interface AsyncValidation {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  payloadFields?: string[];
  responsePath?: string;
  validationExpr?: string;
  message?: string;
  retryCount?: number;
  timeoutMs?: number;
  cacheTTL?: number;
  headers?: Record<string, string>;
}

/** Cross-field validation (dependent on multiple fields) */
export interface CrossFieldValidation {
  fields: string[];
  validator: (values: Record<string, any>) => boolean | string;
  message: string;
  severity?: "error" | "warning";
}

/** Full validation settings for a field or form */
export interface ValidationSettings {
  rules?: ValidationRule[];
  async?: AsyncValidation;
  crossField?: CrossFieldValidation[];
  groups?: {
    name: string;
    fields: string[];
    validateTogether?: boolean;
    triggerOn?: ("change" | "blur" | "submit")[];
  }[];
  validateOn?: ("change" | "blur" | "submit")[];
  debounceMs?: number;
  disableDeferredValidation?: boolean;
  /** Explicit source fields whose changes trigger re-validation of this field. */
  dependsOn?: string[];
}

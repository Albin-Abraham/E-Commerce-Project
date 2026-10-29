/** Reactive value definition */
export interface ReactiveValue<_T = any> {
  expression: string;
  dependsOn: string[];
  debounceMs?: number;
  returnType?: "string" | "number" | "boolean" | "array" | "object";
}

/** Computed field */
export interface ComputedField {
  formula: string;
  dependsOn: string[];
  debounceMs?: number;
  returnType?: "string" | "number" | "boolean" | "array" | "object";
  validateOnCompute?: boolean;
}

export interface WorkflowState {
  id: string;
  label: string;
  editableFields?: string[];
  readOnlyFields?: string[];
  hiddenFields?: string[];
  allowedTransitions?: string[];
}

export interface WorkflowDefinition {
  initialState: string;
  states: Record<string, WorkflowState>;
  transitions?: Record<
    string,
    { from: string; to: string; requiredRole?: string }
  >;
}

export interface DeclarativeRule {
  id: string;
  condition: string;
  action: "require" | "hide" | "show" | "disable" | "setValue" | "notify";
  targetField: string;
  value?: any;
  priority?: number;
}

export interface BehaviorDefinition<
  TFormData extends Record<string, any> = Record<string, any>,
> {
  workflow?: WorkflowDefinition;
  rules?: DeclarativeRule[];
  pipeline?: {
    nextStep?: (formData: TFormData, currentSection: any) => string | null;
    preValidation?: (formData: TFormData) => Promise<boolean> | boolean;
    postSubmit?: (response: any, formData: TFormData) => void;
  };
}

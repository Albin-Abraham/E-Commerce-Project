import type { FormField } from "./field";
import type { FieldConditionExpression } from "./condition";
import type { Accessibility, TranslatedText } from "./i18n";
import type { ReactiveValue } from "./reactive";
import type { PerformanceSettings } from "./security-performance";

export interface SectionLayoutConfig {
  type?: "vertical" | "grid" | "horizontal" | "tabs" | "wizard" | "accordion" | string;
  columns?: number;
  gap?: string | number;
  [key: string]: any;
}

export interface StepConfig {
  id: string;
  title: string | TranslatedText;
  description?: string | TranslatedText;
  icon?: string;
  isOptional?: boolean;
  canSkip?: boolean;
}

export interface FormSection {
  id: string;
  key?: string;
  title: string | TranslatedText;
  description?: string;
  layout?: SectionLayoutConfig;
  fields: FormField[];
  subSections?: FormSection[];
  nextStep?: string | ((values: any) => string | null);
  properties?: {
    labelPlacement?: "top" | "side" | "hidden";
    [key: string]: any;
  };
  meta?: {
    conditions?: FieldConditionExpression;
    className?: string;
    ui?: {
      className?: string;
      classNames?: Record<string, string>;
      [key: string]: any;
    };
    performance?: PerformanceSettings;
    accessibility?: Accessibility;
  };
  visible?: boolean | ReactiveValue<boolean>;
  enabled?: boolean | ReactiveValue<boolean>;
}

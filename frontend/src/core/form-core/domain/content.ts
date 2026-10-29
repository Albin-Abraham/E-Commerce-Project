import type { RawFormField, RawFormSection } from "./field";
import type { FieldConditionExpression } from "./condition";
import type { TranslatedText } from "./i18n";
import type { ValidationSettings } from "./validation";

export interface ContentFieldDefinition {
  id: string;
  name: string;
  type: string;
  label: string | TranslatedText;
  description?: string | TranslatedText;
  required?: boolean;
  defaultValue?: any;
  validation?: ValidationSettings;
  condition?: FieldConditionExpression;
  metadata?: Record<string, any>;
}

export interface ContentSectionDefinition<
  TData extends Record<string, any> = Record<string, any>,
> {
  id: string;
  title: string | TranslatedText;
  description?: string | TranslatedText;
  fields: (ContentFieldDefinition | RawFormField<any, any, TData>)[];
  condition?: FieldConditionExpression;
}

export interface ContentDefinition<
  TFormData extends Record<string, any> = Record<string, any>,
> {
  id: string;
  entityName?: string;
  title: string | TranslatedText;
  description?: string | TranslatedText;
  sections?: (
    | ContentSectionDefinition<TFormData>
    | RawFormSection<TFormData>
  )[];
  fields?: (
    | ContentFieldDefinition
    | RawFormField<any, any, TFormData>
  )[];
  validation?: ValidationSettings;
  conditions?: Record<string, FieldConditionExpression>;
  defaultValues?: Partial<TFormData>;
  customData?: Record<string, any>;
}

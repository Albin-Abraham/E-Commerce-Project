import type { FormField, RawFormField, RawFormSection, StringPath } from "./field";
import type { FieldConditionExpression } from "./condition";
import type { TranslatedText } from "./i18n";
import type { FormSection } from "./section";
import type { ContentDefinition } from "./content";
import type { SurfaceDefinition } from "./surface";
import type { BehaviorDefinition } from "./behavior";
import type { GovernanceDefinition } from "./governance";
import type { PresentationDefinition } from "./presentation";
import type {
  HistorySettings,
  PerformanceSettings,
  SecuritySettings,
} from "./security-performance";
import type { ValidationSettings } from "./validation";

export type FormMetadataEvents<
  TFormData extends Record<string, any> = Record<string, any>,
> = {
  onInit?: (formData: TFormData) => void;
  onChange?: (
    formData: TFormData,
    changedField?: FormField<any, any, TFormData>
  ) => any;
  onSelectChange?: (
    formData: TFormData,
    changedField?: FormField<any, any, TFormData>
  ) => any;
  beforeSubmit?: (formData: TFormData) => boolean | void;
  onSubmit?: (formData: TFormData) => Promise<void> | void;
  afterSubmit?: (formData: TFormData) => void;
  onError?: (error: Error, formData: TFormData) => void;
};

export interface NavigationGuardConfig {
  enabled?: boolean;
  domainName?: string | TranslatedText;
  title?: string | TranslatedText;
  message?: string | TranslatedText;
  confirmLabel?: string | TranslatedText;
  confirm?: string | TranslatedText;
  cancelLabel?: string | TranslatedText;
  cancel?: string | TranslatedText;
  toastTitle?: string | TranslatedText;
  toastDescription?: string | TranslatedText;
  params?: Record<string, string | number>;
}

export interface FormDefinition<
  TFormData extends Record<string, any> = Record<string, any>,
> {
  id: string;
  version?: string;
  schemaVersion?: number;

  content?: ContentDefinition<TFormData>;
  surface?: SurfaceDefinition;
  behavior?: BehaviorDefinition<TFormData>;
  governance?: GovernanceDefinition;
  presentation?: PresentationDefinition;

  title: string | TranslatedText;
  description?: string | TranslatedText;
  sections?: RawFormSection<TFormData>[];
  fields?: RawFormField<any, any, TFormData>[];
  submitLabel?: string | TranslatedText;
  cancelLabel?: string | TranslatedText;

  layout?:
    | "vertical"
    | "split"
    | "grid"
    | "custom"
    | { type: string; config?: any };
  containers?: any[];
  shell?: any[];

  settings?: {
    width?: "full" | "contained" | "centered";
    density?: "compact" | "comfortable" | "spacious";
    maxHeight?: string;
    stickyHeader?: boolean;
    stickyFooter?: boolean;
    hideHeader?: boolean;
    hideFooter?: boolean;
    showValidationOnTouch?: boolean;
    layoutMode?: any;
    mode?: "edit" | "view";
    navigationGuard?: boolean | NavigationGuardConfig;
    wizard?: {
      enabled: boolean;
      stepperType?: "sidebar" | "top";
      linear?: boolean;
    };
    [key: string]: any;
  };

  pipeline?: {
    nextStep?: (
      formData: TFormData,
      currentSection: FormSection
    ) => string | null;
    middleware?: ((formData: TFormData) => void | Promise<void>)[];
  };

  events?: {
    onInit?: (formData: TFormData) => void;
    onChange?: (
      formData: TFormData,
      changedField?: FormField<any, any, TFormData>
    ) => void;
    onSelectChange?: (
      formData: TFormData,
      changedField: FormField<any, any, TFormData>
    ) => any;
    beforeSubmit?: (formData: TFormData) => boolean | void;
    onSubmit?: (formData: TFormData) => Promise<void> | void;
    afterSubmit?: (formData: TFormData) => void;
    onError?: (error: Error, formData: TFormData) => void;
  };
  metadata?: {
    locale?: string;
    events?: FormMetadataEvents<TFormData>;
    [key: string]: any;
  };

  customData?: Record<string, any>;

  style?: {
    primaryColor?: string;
    backgroundColor?: string;
    borderRadius?: string;
    fontFamily?: string;
    customClasses?: string;
    classNames?: {
      shell?: string;
      atmosphere?: string;
      root?: string;
      header?: string;
      title?: string;
      description?: string;
      body?: string;
      footer?: string;
      actionContainer?: string;
      submitButton?: string;
      cancelButton?: string;
      [key: string]: string | undefined;
    };
    [key: string]: any;
  };

  injections?: {
    validations?: Partial<
      Record<
        StringPath<TFormData> | (string & {}),
        ValidationSettings
      >
    >;
    ui?: Partial<
      Record<
        StringPath<TFormData> | (string & {}),
        Partial<FormField<any, any, TFormData>>
      >
    >;
    conditions?: Partial<
      Record<
        StringPath<TFormData> | (string & {}),
        FieldConditionExpression
      >
    >;
    layout?: Partial<Record<string, any>>;
    behavior?: Partial<Record<string, any>>;
    theme?: Partial<Record<string, any>>;
    print?: Partial<Record<string, any>>;
  };

  validation?: ValidationSettings;
  performance?: PerformanceSettings;
  security?: SecuritySettings;
  history?: HistorySettings;
}

export interface FormUIFieldConfig {
  layout?: any;
  properties?: any;
  meta?: any;
  fields?: Record<string, FormUIFieldConfig>;
  gridColumn?: string | number;
  [key: string]: any;
}

export interface FormUISectionConfig {
  layout?: any;
  meta?: any;
  fields?: Record<string, FormUIFieldConfig>;
  [key: string]: any;
}

export interface FormUIConfig {
  fields?: Record<string, FormUIFieldConfig>;
  sections?: Record<string, FormUISectionConfig>;
  fieldConfig?: Record<string, FormUIFieldConfig>;
  settings?: FormDefinition["settings"];
  style?: FormDefinition["style"];
  layout?: any;
  containers?: any[];
  shell?: any[];
}

export interface RenderDefinition<
  TFormData extends Record<string, any> = Record<string, any>,
> {
  sections: RawFormSection<TFormData>[];
  layout?: string | { type: string; config?: any };
  settings?: {
    density?: "compact" | "comfortable" | "spacious";
  };
  style?: any;
}

export interface DetailDefinition<
  TData extends Record<string, any> = Record<string, any>,
> {
  id?: string;
  title?: string | TranslatedText;
  subtitle?: string | TranslatedText;
  badgeIcon?: string;
  sections?: RawFormSection<TData>[];
  fields?: RawFormField<any, any, TData>[];
  layout?: string | { type: string; config?: any };
  slots?: {
    header?: boolean | string;
    media?: boolean | string;
    actions?: boolean | string;
    footer?: boolean | string;
    [slotName: string]: boolean | string | undefined;
  };
  settings?: {
    density?: "compact" | "comfortable" | "spacious";
    layoutStyle?: "cards" | "key-value" | "flat";
  };
  style?: any;
}

import type { FieldCapabilities } from "./field";

export type ManifestFieldCategory =
  | "input"
  | "static"
  | "container"
  | "composite";

export type FieldRouting = "leaf" | "container" | "repeater" | "slot";

export interface FieldManifest {
  type: string;
  aliases?: string[];
  _isAlias?: boolean;
  category: ManifestFieldCategory;
  routing: FieldRouting;
  capabilities: FieldCapabilities;
  label: string;
  description?: string;
  icon?: any;
  component?: any;
  loader?: () => Promise<{ default: any }>;
  wrapper?: {
    enabled: boolean;
    showLabel?: boolean;
    wrapOuter?: boolean;
  };
  layout?: {
    acceptsChildren: boolean;
    childLayoutMode?: string;
    defaultColumns?: number;
  };
  overridable?: boolean;
}

export interface LayoutRendererManifest {
  type: string;
  category: ManifestFieldCategory;
  acceptsChildren: boolean;
  childLayout?: string;
  component?: any;
  label?: string;
}

export interface InstanceDefinition {
  options?: {
    source: "static" | "remote" | "computed";
    items?: Array<{ label: string; value: any; disabled?: boolean }>;
    remote?: {
      url: string;
      method?: "GET" | "POST";
      params?: Record<string, string>;
      headers?: Record<string, string>;
      watch?: string[];
      mapping?: {
        valuePath: string;
        labelPath: string;
        groupBy?: string;
      };
    };
    search?: {
      mode: "client" | "server";
      minChars?: number;
      debounceMs?: number;
    };
  };
  selection?: {
    mode: "single" | "multiple" | "tags";
    clearable?: boolean;
    creatable?: boolean;
    maxItems?: number;
  };
  valueMapper?: {
    match?: (a: any, b: any) => boolean;
    toModel?: (display: any) => any;
    toDisplay?: (modelValue: any) => any;
  };
}

import React from "react";
import type { Form } from "@form-core/form";
import type { StyleAdapter } from "@ui/form/styles/style-adapter";
import type {
  DetailDefinition,
  FormDefinition,
  FormField,
  RenderDefinition,
} from "@ui/form/types";

export interface DetailRendererSlots<T = any> {
  headerSlot?: React.ReactNode | React.ComponentType<{ data?: T }>;
  mediaSlot?: React.ReactNode | React.ComponentType<{ data?: T }>;
  actionSlot?: React.ReactNode | React.ComponentType<{ data?: T }>;
  footerSlot?: React.ReactNode | React.ComponentType<{ data?: T }>;
  [slotName: string]: any;
}

export interface DetailRendererProps<
  T extends Record<string, any> = Record<string, any>,
> {
  /**
   * The schema or render definition describing fields and sections.
   * Can be a FormDefinition, RenderDefinition, or DetailDefinition.
   */
  definition?: FormDefinition<T> | RenderDefinition<T> | DetailDefinition<T>;

  /**
   * Direct list of fields to render if definition is not provided.
   */
  fields?: FormField[];

  /**
   * Entity data record supplying values to display or interact with.
   */
  data?: T;

  /**
   * Presentation mode:
   * - "display" (default): Read-only view. Form fields render formatted values, badges, and chips.
   * - "interactive": Standalone interactive widgets (switches, buttons, sliders) without <form> submission.
   */
  mode?: "display" | "interactive";

  /**
   * Layout presentation style for fields:
   * - "cards" (default): Groups fields in elevated cards with headers and dividers.
   * - "key-value": Renders fields as compact two-column definition lists (label: value).
   * - "flat": Minimal clean container without card elevations.
   */
  layoutStyle?: "cards" | "key-value" | "flat";

  /**
   * Density token for spacing and padding.
   */
  density?: "compact" | "comfortable" | "spacious";

  /**
   * Injected Slots map for structural positions and field-level overrides.
   */
  slots?: DetailRendererSlots<T>;

  /**
   * Optional change handler for interactive mode.
   */
  onChange?: (fieldId: string, value: any) => void;

  /**
   * Root CSS class name.
   */
  className?: string;

  /**
   * Style adapter for theme overrides.
   */
  adapter?: StyleAdapter;

  /**
   * Optional custom React 19 Suspense fallback component for incremental hydration.
   */
  fallback?: React.ReactNode;

  /**
   * Whether to wrap card surfaces in React Suspense boundaries. Default: true when fallback provided.
   */
  suspense?: boolean;

  /**
   * Whether to enable virtualized windowing container for large datasets.
   */
  virtualized?: boolean;

  /**
   * Maximum viewport height or row limit when virtualized is enabled.
   */
  maxDisplayRows?: number;
}

/**
 * Runtime services produced by the form engine. Absent entirely when a
 * plain display definition has no conditional rules — keeping the
 * "formless" detail view free of engine/provider overhead.
 */
export interface DetailRuntime {
  form?: Form<any>;
  visibility?: Record<string, boolean>;
  /** Engine-backed component props factory (interactive mode only). */
  engineGetComponentProps?: (fieldId: string) => any;
  remoteOptions?: {
    executeSearch: (fieldId: string, query: string) => void;
    refresh?: (fieldId: string) => void;
    getOptions?: (
      fieldId: string
    ) => ReadonlyArray<{ label: string; value: unknown }>;
    isLoading?: (fieldId: string) => boolean;
  } | null;
}

export interface DetailRendererInternalProps<
  T extends Record<string, any> = Record<string, any>,
> extends DetailRendererProps<T> {
  nodes: FormField[];
  runtime?: DetailRuntime;
}

export interface HeaderRendererProps {
  title: string;
  subtitle?: string;
  badgeIcon?: string | React.ReactNode;
  status?: {
    label: string;
    variant?: "primary" | "success" | "warning" | "danger" | "default";
  };
  tags?: string[];
  className?: string;
  children?: React.ReactNode;
}

export interface KeyDetailsCardRendererProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /**
   * Optional custom Suspense fallback placeholder.
   */
  fallback?: React.ReactNode;
  /**
   * Whether to wrap card content in React 19 Suspense streaming boundary.
   */
  suspense?: boolean;
}

export interface BottomActionSlotRendererProps {
  children: React.ReactNode;
  className?: string;
  sticky?: boolean;
}

export interface KeyValueRowProps {
  label: React.ReactNode;
  value: React.ReactNode;
  description?: string;
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export interface ValueDisplayProps {
  value: any;
  type?: string;
  options?: readonly any[];
  format?: string;
  currency?: string;
  emptyPlaceholder?: string;
  className?: string;
}

export type NormalizedDisplayModel =
  | { kind: "empty"; text: string }
  | { kind: "boolean"; value: boolean; isTrue: boolean }
  | { kind: "option"; label: string; icon?: string }
  | { kind: "email"; href: string; label: string; isSafe: boolean }
  | { kind: "phone"; href: string; label: string; isSafe: boolean }
  | { kind: "url"; href: string; label: string; isSafe: boolean }
  | { kind: "image"; src: string }
  | { kind: "array"; items: unknown[] }
  | { kind: "currency"; text: string }
  | { kind: "date"; text: string }
  | { kind: "text"; text: string };

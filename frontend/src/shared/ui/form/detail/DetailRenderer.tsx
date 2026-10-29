import React, { useMemo } from "react";

import { hasConditionalRules } from "@form-core/modules/visibility";
import type { FormField } from "@ui/form/types";
import { SchemaNormalizer } from "@ui/form/utils/SchemaNormalizer";

import {
  DetailBottomActions,
  DetailCardSkeleton,
  DetailHeader,
  DetailKeyDetailsCard,
  DetailKeyValueRow,
  DetailValueDisplay,
} from "./components";
import { DetailRendererView, DetailRuntimeBoundary } from "./runtime";
import type { DetailRendererProps } from "./types";

/**
 * DetailRenderer - Formless Definition-Driven UI Presentation Engine.
 *
 * Renders structured schemas, fields, and slots purely as a presentation or detail view
 * WITHOUT a <form> tag, submit buttons, or form validation controller overhead.
 *
 * Architecture:
 * - Display mode without conditional rules renders WITHOUT the form engine at all (pure functional projection).
 * - Interactive mode (or display with conditions) mounts `DetailRuntimeBoundary`,
 *   which owns `useForm` and exposes engine services through `DetailRuntime`.
 * - All subcomponents (`Header`, `KeyDetailsCard`, `BottomActions`, `KeyValueRow`, `ValueDisplay`)
 *   are attached as compound properties for ergonomic discovery.
 */
export function DetailRenderer<
  T extends Record<string, any> = Record<string, any>,
>(props: DetailRendererProps<T>) {
  const { definition, fields: directFields, mode = "display" } = props;

  // 1. Normalize schema definition into canonical FieldNode tree
  const nodes: FormField[] = useMemo(() => {
    if (directFields && directFields.length > 0) {
      return directFields;
    }
    if (definition) {
      return SchemaNormalizer.normalize(definition as any);
    }
    return [];
  }, [definition, directFields]);

  const needsEngine = mode === "interactive" || hasConditionalRules(nodes);

  if (needsEngine) {
    return <DetailRuntimeBoundary {...props} nodes={nodes} />;
  }
  return <DetailRendererView {...props} nodes={nodes} />;
}

// Compound component subcomponents for ergonomic discovery
DetailRenderer.Header = DetailHeader;
DetailRenderer.KeyDetailsCard = DetailKeyDetailsCard;
DetailRenderer.Skeleton = DetailCardSkeleton;
DetailRenderer.BottomActions = DetailBottomActions;
DetailRenderer.KeyValueRow = DetailKeyValueRow;
DetailRenderer.ValueDisplay = DetailValueDisplay;

// Re-export canonical types
export type {
  DetailRendererProps,
  DetailRendererSlots,
  DetailRuntime,
  DetailRendererInternalProps,
  HeaderRendererProps,
  KeyDetailsCardRendererProps,
  BottomActionSlotRendererProps,
  KeyValueRowProps,
  ValueDisplayProps,
} from "./types";

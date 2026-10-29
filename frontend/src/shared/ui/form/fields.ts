/* ============================================================================
 *  FORM FIELD TYPES (Presentation Layer)
 * ============================================================================*/
import type React from "react";

// Re-export all headless domain field definitions from @form-core/domain
export * from "@form-core/domain/field";

// Re-export contract types for UI consumers
export type {
  LabelPlacement,
  SlotPlacement,
  SlotDescriptor,
  VirtualizationConfig,
  FileDropzoneConfig,
  SliderTickMark,
  SliderConfig,
  FieldBadgeConfig,
} from "./types/contract";

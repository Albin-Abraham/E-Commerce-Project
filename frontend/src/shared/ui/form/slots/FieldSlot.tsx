import React from "react";
import type { FormField, SlotPlacement, SlotDescriptor } from "../fields";
import { slotRegistry } from "./SlotRegistry";

export interface FieldSlotProps {
  /** Slot target location */
  placement: SlotPlacement;
  /** The associated form field definition */
  field: FormField;
  /** Fallback node if slot is not specified or resolved */
  fallback?: React.ReactNode;
  /** Additional wrapper CSS classes */
  className?: string;
  /** Current field value */
  value?: any;
  /** Change callback */
  onChange?: (val: any) => void;
  /** Current field error flag */
  error?: boolean;
  /** Error message string */
  errorMessage?: string;
}

/**
 * FieldSlot — Declarative Dynamic Slot Renderer.
 *
 * Resolves slot content in standard priority order:
 * 1. Declarative schema `field.properties.slots[placement]` (supports slotId, descriptor, or ReactNode)
 * 2. Fallback content provided by the caller (e.g., standard startContent / endContent)
 */
export const FieldSlot: React.FC<FieldSlotProps> = ({
  placement,
  field,
  fallback = null,
  className,
  value,
  onChange,
  error,
  errorMessage,
}) => {
  const slotDef = field.properties?.slots?.[placement];

  if (!slotDef) {
    if (!fallback) return null;
    return className ? <div className={className}>{fallback}</div> : <>{fallback}</>;
  }

  // 1. Direct React Element or string / primitive ReactNode
  if (React.isValidElement(slotDef)) {
    return className ? <div className={className}>{slotDef}</div> : <>{slotDef}</>;
  }

  // 2. String lookup: Check if it's a registered slotId in SlotRegistry
  if (typeof slotDef === "string") {
    const RegisteredComponent = slotRegistry.get(slotDef);
    if (RegisteredComponent) {
      return (
        <div className={className}>
          <RegisteredComponent
            field={field}
            value={value}
            onChange={onChange}
            error={error}
            errorMessage={errorMessage}
          />
        </div>
      );
    }
    // String was not a registered slotId — render as literal text
    return className ? <div className={className}>{slotDef}</div> : <>{slotDef}</>;
  }

  // 3. Declarative SlotDescriptor object: { slotId, props }
  if (typeof slotDef === "object" && "slotId" in slotDef) {
    const descriptor = slotDef as SlotDescriptor;
    const RegisteredComponent = slotRegistry.get(descriptor.slotId);
    if (RegisteredComponent) {
      return (
        <div className={className}>
          <RegisteredComponent
            field={field}
            slotProps={descriptor.props}
            value={value}
            onChange={onChange}
            error={error}
            errorMessage={errorMessage}
          />
        </div>
      );
    }
    console.warn(
      `[FieldSlot] Unregistered slotId "${descriptor.slotId}" requested for field "${field.name}" at placement "${placement}".`
    );
    return fallback ? (
      className ? <div className={className}>{fallback}</div> : <>{fallback}</>
    ) : null;
  }

  // 4. Function component passed directly
  if (typeof slotDef === "function") {
    const Component = slotDef as React.ComponentType<any>;
    return (
      <div className={className}>
        <Component
          field={field}
          value={value}
          onChange={onChange}
          error={error}
          errorMessage={errorMessage}
        />
      </div>
    );
  }

  return fallback ? (
    className ? <div className={className}>{fallback}</div> : <>{fallback}</>
  ) : null;
};

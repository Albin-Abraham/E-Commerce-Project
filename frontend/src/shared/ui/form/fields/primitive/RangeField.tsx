import React from "react";

import type { FormField } from "@ui/form/fields";
import type { FieldLayout } from "@ui/form/utils/form-layout-utils";
import { cn } from "@ui/form/utils/form-styles";

import type { AtomicFieldProps } from "./types";

export interface RangeFieldProps extends Partial<AtomicFieldProps<number>> {
  field?: Partial<FormField>;
  value?: number;
  onChange?: (val: number | undefined) => void;
  layout?: Partial<FieldLayout>;
  error?: boolean | string;
  className?: string;
  unit?: string;
  styles?: { input?: string; [key: string]: string | undefined };
  min?: number;
  max?: number;
  step?: number;
  [key: string]: unknown;
}

export const RangeField = React.forwardRef<HTMLInputElement, RangeFieldProps>(
  (
    {
      name,
      type,
      component,
      id,
      label,
      placeholder: _placeholder,
      disabled,
      readOnly,
      required,
      min: propMin,
      max: propMax,
      step: propStep,
      field,
      layout,
      value,
      onChange,
      error,
      className,
      styles,
      unit: propUnit,
      ...rest
    },
    ref
  ) => {
    const resolvedName = name ?? field?.name;
    const resolvedType = type ?? field?.type ?? "range";
    const resolvedId = id ?? field?.id ?? resolvedName;
    const resolvedComponent =
      typeof component === "string"
        ? component
        : typeof field?.component === "string"
          ? field.component
          : "range";

    const props = field?.properties || {};
    const min = Number(propMin ?? layout?.min ?? props.min ?? 0);
    const max = Number(propMax ?? layout?.max ?? props.max ?? 100);
    const step = Number(propStep ?? layout?.step ?? props.step ?? 1);
    const safeValue = typeof value === "number" ? value : min;
    const unit = propUnit || (props as any).unit || (layout as any)?.unit || "";

    const isDisabled = Boolean(
      disabled ?? layout?.disabled ?? field?.disabled ?? false
    );
    const isReadOnly = Boolean(readOnly ?? layout?.readOnly ?? false);
    const isRequired = Boolean(required ?? field?.required);

    const rangeSpan = max - min || 1;
    const percentage = Math.max(
      0,
      Math.min(100, ((safeValue - min) / rangeSpan) * 100)
    );

    return (
      <div className={cn("flex flex-col w-full gap-2 select-none", className)}>
        {/* Header row with current value badge */}
        <div className="flex items-center justify-between">
          {label && (
            <span className="text-sm font-medium text-foreground leading-snug">
              {typeof label === "string"
                ? label
                : (label as any).en || String(label)}
            </span>
          )}
          <span className="ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-xs tracking-tight shadow-2xs">
            {safeValue}
            {unit && (
              <span className="ml-0.5 font-normal opacity-70">{unit}</span>
            )}
          </span>
        </div>

        {/* Custom Range Slider Track & Thumb */}
        <div className="relative flex items-center w-full py-1">
          <input
            type="range"
            ref={ref}
            id={resolvedId}
            name={resolvedName}
            min={min}
            max={max}
            step={step}
            value={safeValue}
            disabled={isDisabled || isReadOnly}
            readOnly={isReadOnly}
            required={isRequired}
            aria-required={isRequired}
            aria-valuenow={safeValue}
            aria-valuemin={min}
            aria-valuemax={max}
            onChange={(e) => onChange?.(Number(e.target.value))}
            data-field-name={resolvedName}
            data-field-type={resolvedType}
            data-field-component={resolvedComponent}
            style={{
              background: `linear-gradient(to right, var(--color-primary, #3b82f6) 0%, var(--color-primary, #3b82f6) ${percentage}%, var(--color-muted, #e2e8f0) ${percentage}%, var(--color-muted, #e2e8f0) 100%)`,
            }}
            className={cn(
              "w-full h-2 rounded-full appearance-none cursor-pointer transition-all outline-none",
              "focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              // WebKit Thumb Styling
              "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5",
              "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:border-2",
              "[&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer",
              "[&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150",
              "[&::-webkit-slider-thumb]:hover:scale-115 [&::-webkit-slider-thumb]:active:scale-95",
              // Mozilla Thumb Styling
              "[&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full",
              "[&::-moz-range-thumb]:bg-background [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary",
              "[&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer",
              "[&::-moz-range-thumb]:hover:scale-115 [&::-moz-range-thumb]:active:scale-95",
              isDisabled && "opacity-50 cursor-not-allowed pointer-events-none",
              styles?.input
            )}
            aria-invalid={!!error}
            {...(rest as any)}
          />
        </div>

        {/* Footer row with Min and Max bounds */}
        <div className="flex justify-between text-[11px] font-medium text-muted-foreground px-0.5">
          <span>
            {min}
            {unit}
          </span>
          <span>
            {max}
            {unit}
          </span>
        </div>
      </div>
    );
  }
);

RangeField.displayName = "RangeField";

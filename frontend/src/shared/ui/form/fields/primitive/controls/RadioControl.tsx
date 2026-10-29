import React from "react";

import { tokens } from "@shared/theme";
import { cn } from "@ui/form/utils/form-styles";

export interface RadioControlProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: string;
  checked?: boolean;
  onChange?: (val: string) => void;
  onNativeChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  styles?: {
    input?: string;
    indicator?: string;
    dot?: string;
    [key: string]: string | undefined;
  };
}

/**
 * RadioControl (Headless Control Atom - Tier 1)
 *
 * Responsibility: Single atomic radio input item with custom indicator dot.
 * Consumes design tokens from `tokens.form.controls.radio.indicator`.
 * Does NOT render option labels or group containers.
 */
export const RadioControl = React.forwardRef<HTMLInputElement, RadioControlProps>(
  function RadioControl(
    {
      id,
      name,
      value,
      checked,
      disabled,
      readOnly,
      required,
      tabIndex,
      onChange,
      onNativeChange,
      className,
      styles,
      "aria-invalid": propAriaInvalid,
      "aria-describedby": propAriaDescribedby,
      ...rest
    },
    ref
  ) {
    const isChecked = Boolean(checked);
    const isDisabled = Boolean(disabled);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled || readOnly) return;
      onNativeChange?.(e);
      onChange?.(value);
    };

    const controlsTokens = tokens.form.controls;
    const radioTokens = controlsTokens.radio;
    const indicatorTokens = radioTokens.indicator;
    const layoutTokens = controlsTokens.layout;

    return (
      <div
        data-control="radio"
        data-checked={isChecked}
        className={cn(
          indicatorTokens.base,
          isChecked ? indicatorTokens.checked : indicatorTokens.unchecked,
          isDisabled && layoutTokens.disabled,
          styles?.indicator,
          className
        )}
      >
        <input
          ref={ref}
          type="radio"
          id={id}
          name={name}
          value={value}
          checked={isChecked}
          disabled={isDisabled}
          readOnly={readOnly}
          required={required}
          tabIndex={tabIndex}
          aria-checked={isChecked}
          aria-invalid={propAriaInvalid}
          aria-describedby={propAriaDescribedby}
          onChange={handleChange}
          className="sr-only peer"
          {...rest}
        />

        {/* Animated Inner Dot */}
        <div
          className={cn(
            indicatorTokens.dot,
            isChecked ? indicatorTokens.dotChecked : indicatorTokens.dotUnchecked,
            styles?.dot
          )}
          aria-hidden="true"
        />
      </div>
    );
  }
);

RadioControl.displayName = "RadioControl";

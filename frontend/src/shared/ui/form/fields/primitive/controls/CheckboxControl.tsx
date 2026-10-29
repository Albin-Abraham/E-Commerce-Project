import React from "react";

import { tokens } from "@shared/theme";
import { cn } from "@ui/form/utils/form-styles";

export interface CheckboxControlProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  checked?: boolean;
  defaultChecked?: boolean;
  indeterminate?: boolean;
  onChange?: (checked: boolean) => void;
  onNativeChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  styles?: {
    input?: string;
    [key: string]: string | undefined;
  };
}

/**
 * CheckboxControl (Headless Control Atom - Tier 1)
 *
 * Responsibility: Pure accessible binary/indeterminate checkbox control.
 * Contains ZERO label, description, or card layout markup.
 */
export const CheckboxControl = React.forwardRef<HTMLInputElement, CheckboxControlProps>(
  function CheckboxControl(
    {
      id,
      name,
      checked,
      defaultChecked,
      indeterminate,
      disabled,
      readOnly,
      required,
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
    const internalRef = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => internalRef.current!);

    const isControlled = checked !== undefined;
    const [internalChecked, setInternalChecked] = React.useState(Boolean(defaultChecked));
    const isChecked = isControlled ? Boolean(checked) : internalChecked;
    const isIndeterminate = Boolean(indeterminate);
    const isDisabled = Boolean(disabled);

    React.useEffect(() => {
      if (internalRef.current) {
        internalRef.current.indeterminate = isIndeterminate;
      }
    }, [isIndeterminate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled || readOnly) return;
      if (!isControlled) {
        setInternalChecked(e.target.checked);
      }
      onNativeChange?.(e);
      onChange?.(e.target.checked);
    };

    const controlsTokens = tokens.form.controls;
    const checkboxTokens = controlsTokens.checkbox;
    const layoutTokens = controlsTokens.layout;

    return (
      <div
        data-control="checkbox"
        data-checked={isChecked}
        data-indeterminate={isIndeterminate}
        className={cn(
          checkboxTokens.container,
          isDisabled && layoutTokens.disabled,
          className
        )}
      >
        <input
          ref={internalRef}
          type="checkbox"
          id={id}
          name={name}
          checked={isControlled ? isChecked : undefined}
          defaultChecked={defaultChecked}
          disabled={isDisabled}
          readOnly={readOnly}
          required={required}
          aria-invalid={propAriaInvalid}
          aria-describedby={propAriaDescribedby}
          onChange={handleChange}
          className={cn(
            checkboxTokens.input,
            isChecked || isIndeterminate
              ? checkboxTokens.checked
              : checkboxTokens.unchecked,
            isIndeterminate && checkboxTokens.indeterminate,
            isDisabled && layoutTokens.disabled,
            styles?.input
          )}
          {...rest}
        />

        {/* Checkmark Icon */}
        {!isIndeterminate && (
          <svg
            aria-hidden="true"
            className={cn(
              checkboxTokens.icon,
              isChecked ? "opacity-100" : checkboxTokens.iconCheck
            )}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}

        {/* Indeterminate Dash Icon */}
        {isIndeterminate && (
          <svg
            aria-hidden="true"
            className={cn(checkboxTokens.icon, checkboxTokens.iconIndeterminate)}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        )}
      </div>
    );
  }
);

CheckboxControl.displayName = "CheckboxControl";

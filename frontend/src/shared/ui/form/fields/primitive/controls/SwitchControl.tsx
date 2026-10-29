import React from "react";

import { tokens } from "@shared/theme";
import { cn } from "@ui/form/utils/form-styles";

export interface SwitchControlProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "onChange" | "value"> {
  checked?: boolean;
  defaultChecked?: boolean;
  size?: "sm" | "md" | "lg";
  onChange?: (checked: boolean) => void;
  onNativeChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  styles?: {
    input?: string;
    track?: string;
    thumb?: string;
    [key: string]: string | undefined;
  };
}

/**
 * SwitchControl (Headless Control Atom - Tier 1)
 *
 * Responsibility: Pure accessible binary toggle with WAI-ARIA switch role.
 * Contains ZERO inline Tailwind CSS strings, deriving all visual tokens from `tokens.form.controls.switch`.
 * Renders as a semantic <span> container to prevent invalid nested <label> HTML when enclosed by SwitchField.
 */
export const SwitchControl = React.forwardRef<HTMLInputElement, SwitchControlProps>(
  function SwitchControl(
    {
      id,
      name,
      checked,
      defaultChecked,
      disabled,
      readOnly,
      required,
      size = "md",
      onChange,
      onNativeChange,
      className,
      styles,
      role = "switch",
      "aria-checked": propAriaChecked,
      "aria-invalid": propAriaInvalid,
      "aria-describedby": propAriaDescribedby,
      ...rest
    },
    ref
  ) {
    const isControlled = checked !== undefined;
    const [internalChecked, setInternalChecked] = React.useState(Boolean(defaultChecked));
    const isChecked = isControlled ? Boolean(checked) : internalChecked;
    const isDisabled = Boolean(disabled);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled || readOnly) return;
      if (!isControlled) {
        setInternalChecked(e.target.checked);
      }
      onNativeChange?.(e);
      onChange?.(e.target.checked);
    };

    const switchTokens = tokens.form.controls.switch;
    const layoutTokens = tokens.form.controls.layout;
    const sizeConfig = switchTokens.sizes[size] ?? switchTokens.sizes.md;

    return (
      <span
        data-control="switch"
        data-checked={isChecked}
        data-size={size}
        className={cn(
          switchTokens.container,
          isDisabled && layoutTokens.disabled,
          className
        )}
      >
        <input
          ref={ref}
          type="checkbox"
          role={role}
          id={id}
          name={name}
          checked={isControlled ? isChecked : undefined}
          defaultChecked={defaultChecked}
          disabled={isDisabled}
          readOnly={readOnly}
          required={required}
          aria-checked={propAriaChecked ?? isChecked}
          aria-invalid={propAriaInvalid}
          aria-describedby={propAriaDescribedby}
          onChange={handleChange}
          className="sr-only peer"
          {...rest}
        />

        {/* Visual Sliding Track & Thumb */}
        <div
          className={cn(
            switchTokens.track,
            sizeConfig.track,
            styles?.track
          )}
          aria-hidden="true"
        >
          <div
            className={cn(
              switchTokens.thumb,
              sizeConfig.thumb,
              isChecked && sizeConfig.thumbChecked,
              styles?.thumb
            )}
          />
        </div>
      </span>
    );
  }
);

SwitchControl.displayName = "SwitchControl";

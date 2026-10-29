import React, { useRef, useCallback } from "react";

import { tokens } from "@shared/theme";
import { getOptionLabel } from "@ui/form/utils/field-utils";
import { cn } from "@ui/form/utils/form-styles";
import { getIcon } from "@ui/form/utils/icon-registry";

import { RadioControl } from "./RadioControl";

export interface RadioOption {
  value: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  icon?: string | React.ComponentType<any>;
  disabled?: boolean;
  [key: string]: unknown;
}

export interface RadioGroupProps {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  options?: readonly RadioOption[];
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  variant?: "default" | "card" | "tile" | "segmented";
  orientation?: "vertical" | "horizontal";
  onChange?: (val: string) => void;
  className?: string;
  styles?: {
    group?: string;
    item?: string;
    indicator?: string;
    input?: string;
    label?: string;
    description?: string;
    [key: string]: string | undefined;
  };
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  "aria-required"?: boolean;
  "aria-errormessage"?: string;
  "aria-keyshortcuts"?: string;
}

/**
 * RadioGroup (Headless / Accessible Group Container - Tier 1)
 *
 * Implements full WAI-ARIA 1.2+ keyboard navigation:
 * - Roving tabIndex (selected option tabIndex=0, rest tabIndex=-1)
 * - ArrowUp / ArrowLeft / ArrowDown / ArrowRight navigation with wrapping
 * - Home / End keys for instant first/last selection
 */
export const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  function RadioGroup(
    {
      id,
      name,
      value,
      defaultValue,
      options = [],
      disabled = false,
      readOnly = false,
      required = false,
      variant = "default",
      orientation = "vertical",
      onChange,
      className,
      styles,
      startContent,
      endContent,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      "aria-required": ariaRequired,
      "aria-errormessage": ariaErrorMessage,
      "aria-keyshortcuts": ariaKeyShortcuts,
      ...rest
    },
    ref
  ) {
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = React.useState<string | undefined>(defaultValue);
    const currentValue = isControlled ? value : internalValue;

    const groupRef = useRef<HTMLDivElement>(null);
    React.useImperativeHandle(ref, () => groupRef.current!);

    const resolvedName = name || id || "radio-group";
    const resolvedId = id || resolvedName;

    const isCard = variant === "card" || variant === "tile";
    const isSegmented = variant === "segmented";
    const isHorizontal = orientation === "horizontal" || isSegmented;

    const enabledOptions = options.filter((opt) => !disabled && !opt.disabled);

    // Determine which option has tabIndex=0 for roving tabIndex
    const activeTabIndexValue = React.useMemo(() => {
      if (currentValue && enabledOptions.some((o) => o.value === currentValue)) {
        return currentValue;
      }
      return enabledOptions[0]?.value;
    }, [currentValue, enabledOptions]);

    const handleSelect = useCallback(
      (optValue: string) => {
        if (disabled || readOnly) return;
        if (!isControlled) {
          setInternalValue(optValue);
        }
        onChange?.(optValue);
      },
      [disabled, readOnly, isControlled, onChange]
    );

    // WAI-ARIA Keyboard Arrow Navigation Handler
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled || readOnly || enabledOptions.length === 0) return;

      const currentIndex = enabledOptions.findIndex((opt) => opt.value === currentValue);
      let nextIndex = -1;

      switch (e.key) {
        case "ArrowDown":
        case "ArrowRight":
          e.preventDefault();
          nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % enabledOptions.length;
          break;
        case "ArrowUp":
        case "ArrowLeft":
          e.preventDefault();
          nextIndex = currentIndex <= 0 ? enabledOptions.length - 1 : currentIndex - 1;
          break;
        case "Home":
          e.preventDefault();
          nextIndex = 0;
          break;
        case "End":
          e.preventDefault();
          nextIndex = enabledOptions.length - 1;
          break;
        default:
          return;
      }

      if (nextIndex >= 0 && nextIndex < enabledOptions.length) {
        const nextOpt = enabledOptions[nextIndex];
        handleSelect(nextOpt.value);

        // Focus the newly selected radio element
        const nextEl = groupRef.current?.querySelector<HTMLInputElement>(
          `input[value="${nextOpt.value}"]`
        );
        nextEl?.focus();
      }
    };

    const controlsTokens = tokens.form.controls;
    const layoutTokens = controlsTokens.layout;
    const typographyTokens = controlsTokens.typography;
    const radioTokens = controlsTokens.radio;

    return (
      <div
        ref={groupRef}
        id={resolvedId}
        role="radiogroup"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        aria-required={ariaRequired ?? required}
        aria-errormessage={ariaErrorMessage}
        aria-keyshortcuts={ariaKeyShortcuts}
        onKeyDown={handleKeyDown}
        data-variant={variant}
        data-orientation={orientation}
        className={cn(
          "w-full",
          isSegmented
            ? radioTokens.group.segmented
            : isHorizontal
              ? radioTokens.group.horizontal
              : isCard
                ? radioTokens.group.grid
                : radioTokens.group.vertical,
          styles?.group,
          className
        )}
        {...rest}
      >
        {startContent}
        {options.map((opt) => {
          const isOptChecked = currentValue === opt.value;
          const isOptDisabled = disabled || opt.disabled;
          const optionId = `${resolvedId}-${opt.value}`;
          const isTabActive = activeTabIndexValue === opt.value;
          const tabIndex = isTabActive && !isOptDisabled ? 0 : -1;

          const OptIconComp = opt.icon ? getIcon(opt.icon) : null;

          if (isSegmented) {
            return (
              <label
                key={opt.value}
                htmlFor={optionId}
                className={cn(
                  radioTokens.segmented.item,
                  isOptChecked
                    ? radioTokens.segmented.itemChecked
                    : radioTokens.segmented.itemUnchecked,
                  isOptDisabled && layoutTokens.disabled,
                  styles?.item
                )}
              >
                <input
                  type="radio"
                  id={optionId}
                  name={resolvedName}
                  value={opt.value}
                  checked={isOptChecked}
                  disabled={isOptDisabled}
                  readOnly={readOnly}
                  required={required}
                  tabIndex={tabIndex}
                  onChange={() => handleSelect(opt.value)}
                  className="sr-only"
                />
                {OptIconComp && (
                  <OptIconComp
                    size={14}
                    className={cn(
                      typographyTokens.icon,
                      "mr-1.5",
                      isOptChecked
                        ? typographyTokens.iconChecked
                        : typographyTokens.iconUnchecked
                    )}
                  />
                )}
                <span>{getOptionLabel(opt.label)}</span>
              </label>
            );
          }

          const hasOptDescription = Boolean(opt.description);

          return (
            <label
              key={opt.value}
              htmlFor={optionId}
              data-checked={isOptChecked}
              className={cn(
                isCard
                  ? cn(
                      radioTokens.card.base,
                      isOptChecked
                        ? radioTokens.card.checked
                        : radioTokens.card.unchecked
                    )
                  : cn(
                      hasOptDescription
                        ? layoutTokens.multiLine
                        : layoutTokens.singleLine
                    ),
                isOptDisabled && layoutTokens.disabled,
                styles?.item
              )}
            >
              <RadioControl
                id={optionId}
                name={resolvedName}
                value={opt.value}
                checked={isOptChecked}
                disabled={isOptDisabled}
                readOnly={readOnly}
                required={required}
                tabIndex={tabIndex}
                onChange={() => handleSelect(opt.value)}
                className={
                  hasOptDescription
                    ? layoutTokens.controlOffset
                    : layoutTokens.controlCenter
                }
                styles={{
                  indicator: styles?.indicator,
                  input: styles?.input,
                }}
              />

              {/* Label & Description Content Stack */}
              <div className={layoutTokens.labelStack}>
                <div className={layoutTokens.labelRow}>
                  {OptIconComp && (
                    <OptIconComp
                      size={16}
                      className={cn(
                        typographyTokens.icon,
                        isOptChecked
                          ? typographyTokens.iconChecked
                          : typographyTokens.iconUnchecked
                      )}
                    />
                  )}
                  <span
                    className={cn(
                      typographyTokens.title,
                      isOptChecked
                        ? typographyTokens.titleChecked
                        : typographyTokens.titleUnchecked,
                      styles?.label
                    )}
                  >
                    {getOptionLabel(opt.label)}
                  </span>
                </div>
                {opt.description && (
                  <span
                    className={cn(
                      typographyTokens.description,
                      styles?.description
                    )}
                  >
                    {typeof opt.description === "string"
                      ? opt.description
                      : getOptionLabel(opt.description)}
                  </span>
                )}
              </div>
            </label>
          );
        })}
        {endContent}
      </div>
    );
  }
);

RadioGroup.displayName = "RadioGroup";

import React, { useRef, useState } from "react";

import { tokens } from "@shared/theme";
import { useFormOrchestrator } from "@ui/form/context/FormOrchestratorContext";
import { cn } from "@ui/form/utils/form-styles";

import type { AtomicFieldProps } from "./types";

export type CodeInputFieldProps = AtomicFieldProps<string> &
  React.InputHTMLAttributes<HTMLInputElement> & { length?: number };

export const CodeInputField = React.forwardRef<
  HTMLInputElement,
  CodeInputFieldProps
>(function CodeInputFieldInternal(
  {
    name,
    type,
    component,
    id,
    label: _label,
    placeholder: _placeholder,
    disabled,
    readOnly,
    required,
    length: propLength,
    field,
    value,
    onChange,
    layout,
    error,
    className,
    styles,
    ...rest
  },
  ref
) {
  const orchestrator = useFormOrchestrator();
  const mode = orchestrator?.mode || "edit";

  const resolvedName = name ?? field?.name;
  const resolvedType = type ?? field?.type ?? "code";
  const resolvedId = id ?? field?.id ?? resolvedName;
  const resolvedComponent =
    typeof component === "string"
      ? component
      : typeof field?.component === "string"
        ? field.component
        : "code";

  // Support length from prop, layout, or properties (default 6)
  const length =
    Number(
      propLength ||
        (layout as any)?.length ||
        field?.properties?.length ||
        (field?.layout as any)?.length
    ) || 6;
  const safeValue = (value || "").toString().slice(0, length);

  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // We keep a hidden actual input to comply with refs and forms
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  React.useImperativeHandle(ref, () => hiddenInputRef.current!);

  const isReadOnly = Boolean(readOnly ?? layout?.readOnly ?? (field?.properties as any)?.readOnly ?? (rest as any).readOnly);
  const isDisabled = Boolean(disabled ?? layout?.disabled ?? field?.disabled ?? false);
  const isRequired = Boolean(required ?? field?.required);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    if (isReadOnly || isDisabled) return;
    const val = e.target.value;
    const char = val.slice(-1);

    const currentChars = Array.from({ length }, (_, i) => safeValue[i] || "");
    if (char) {
      currentChars[index] = char;
      // Join characters to update form state
      const joined = currentChars.join("");
      onChange?.(joined);

      // Auto-advance focus to next input
      if (index < length - 1) {
        const nextInput = containerRef.current?.querySelector(
          `input[data-index="${index + 1}"]`
        ) as HTMLInputElement;
        nextInput?.focus();
      }
    } else {
      // Deletion of single box character
      currentChars[index] = "";
      onChange?.(currentChars.join(""));
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (isReadOnly || isDisabled) return;

    if (e.key === "Backspace") {
      e.preventDefault();
      const newValue = safeValue.split("");

      if (newValue[index]) {
        // Clear current
        newValue[index] = "";
        onChange?.(newValue.join(""));
      } else if (index > 0) {
        // Clear previous and focus it
        newValue[index - 1] = "";
        onChange?.(newValue.join(""));
        const prevInput = containerRef.current?.querySelector(
          `input[data-index="${index - 1}"]`
        ) as HTMLInputElement;
        prevInput?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      const prevInput = containerRef.current?.querySelector(
        `input[data-index="${index - 1}"]`
      ) as HTMLInputElement;
      prevInput?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      const nextInput = containerRef.current?.querySelector(
        `input[data-index="${index + 1}"]`
      ) as HTMLInputElement;
      nextInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (isReadOnly || isDisabled) return;

    const pastedData = e.clipboardData.getData("text/plain").slice(0, length);
    onChange?.(pastedData);

    // Focus last filled input
    const nextIndex = Math.min(pastedData.length, length - 1);
    const nextInput = containerRef.current?.querySelector(
      `input[data-index="${nextIndex}"]`
    ) as HTMLInputElement;
    nextInput?.focus();
  };

  const codeTokens = tokens.form.controls.codeInput;

  if (mode === "view") {
    const formattedViewValue =
      length === 6 && safeValue.length === 6
        ? `${safeValue.slice(0, 3)} — ${safeValue.slice(3, 6)}`
        : safeValue;

    return (
      <div
        className={cn(
          "w-full text-center text-lg font-bold text-foreground py-2 tracking-widest",
          !safeValue && "text-muted-foreground italic font-normal text-sm",
          styles?.input,
          className
        )}
      >
        {formattedViewValue || "—"}
      </div>
    );
  }

  // Create array of length
  const boxes = Array.from({ length }, (_, i) => i);
  const isSixDigit = length === 6;

  const renderBox = (index: number) => {
    const char = safeValue[index] || "";
    const isFocused = focusedIndex === index;
    const isFilled = Boolean(char);

    return (
      <input
        key={index}
        data-index={index}
        type="text"
        inputMode="text"
        maxLength={2}
        value={char}
        disabled={isDisabled}
        readOnly={isReadOnly}
        onChange={(e) => handleChange(e, index)}
        onKeyDown={(e) => handleKeyDown(e, index)}
        onPaste={handlePaste}
        onFocus={() => setFocusedIndex(index)}
        onBlur={() => setFocusedIndex(null)}
        aria-label={`Digit ${index + 1} of ${length}`}
        className={cn(
          codeTokens.box,
          codeTokens.boxHover,
          isFilled && codeTokens.boxFilled,
          isFocused && codeTokens.boxFocused,
          error && codeTokens.boxError,
          isDisabled && codeTokens.boxDisabled,
          styles?.box
        )}
      />
    );
  };

  return (
    <div
      className={cn(codeTokens.container, styles?.wrapper, className)}
      ref={containerRef}
      id={resolvedId}
      data-field-name={resolvedName}
      data-field-type={resolvedType}
      data-field-component={resolvedComponent}
      data-code-length={length}
    >
      <input
        type="hidden"
        ref={hiddenInputRef}
        name={resolvedName}
        id={resolvedId ? `${resolvedId}-value` : undefined}
        value={safeValue}
        required={isRequired}
        aria-required={isRequired}
      />

      {isSixDigit ? (
        <>
          <div className={codeTokens.group}>
            {boxes.slice(0, 3).map((idx) => renderBox(idx))}
          </div>
          <span className={codeTokens.separator} aria-hidden="true" />
          <div className={codeTokens.group}>
            {boxes.slice(3, 6).map((idx) => renderBox(idx))}
          </div>
        </>
      ) : (
        <div className={codeTokens.group}>
          {boxes.map((idx) => renderBox(idx))}
        </div>
      )}
    </div>
  );
});

CodeInputField.displayName = "CodeInputField";

import React, { useRef, useState } from "react";

import { useFormOrchestrator } from "@ui/form/context/FormOrchestratorContext";
import { getI18nString } from "@ui/form/utils/field-utils";
import { cn } from "@ui/form/utils/form-styles";

import type { AtomicFieldProps } from "./types";

const COUNTRY_CODES = [
  { code: "+1", label: "US" },
  { code: "+44", label: "UK" },
  { code: "+91", label: "IN" },
  { code: "+61", label: "AU" },
  { code: "+81", label: "JP" },
];

export const PhoneField = React.forwardRef<
  HTMLInputElement,
  AtomicFieldProps<string> & React.InputHTMLAttributes<HTMLInputElement>
>(function PhoneFieldInternal(
  {
    name,
    type,
    component,
    id,
    label: _label,
    placeholder,
    disabled,
    readOnly,
    required,
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
  const inputRef = useRef<HTMLInputElement>(null);
  const orchestrator = useFormOrchestrator();
  const mode = orchestrator?.mode || "edit";

  React.useImperativeHandle(ref, () => inputRef.current!);

  const resolvedName = name ?? field?.name;
  const resolvedType = type ?? field?.type ?? "phone";
  const resolvedId = id ?? field?.id ?? resolvedName;
  const resolvedComponent =
    typeof component === "string"
      ? component
      : typeof field?.component === "string"
        ? field.component
        : "phone";

  const isReadOnly = Boolean(readOnly ?? layout?.readOnly ?? (rest as any).readOnly);
  const isDisabled = Boolean(disabled ?? layout?.disabled ?? field?.disabled ?? false);
  const isRequired = Boolean(required ?? field?.required);

  const safeValue = value ?? "";

  // Extract country code and phone number from safeValue
  const [selectedCode, setSelectedCode] = useState(() => {
    const match = COUNTRY_CODES.find((c) => safeValue.startsWith(c.code));
    return match ? match.code : "+1";
  });

  React.useEffect(() => {
    const match = COUNTRY_CODES.find((c) => safeValue.startsWith(c.code));
    if (match && match.code !== selectedCode) {
      setSelectedCode(match.code);
    }
  }, [safeValue, selectedCode]);

  const displayValue = safeValue.startsWith(selectedCode)
    ? safeValue.slice(selectedCode.length).trim()
    : safeValue;

  const placeholderText =
    placeholder !== undefined
      ? getI18nString(placeholder as any)
      : (getI18nString(layout?.placeholder ?? field?.properties?.placeholder ?? (field as any)?.placeholder) || "555 555 5555");

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onChange || isReadOnly || isDisabled) return;
    const rawNumber = e.target.value.replace(/[^\d\s-]/g, ""); // Allow only digits, spaces, hyphens
    onChange(`${selectedCode} ${rawNumber}`.trim());
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!onChange || isReadOnly || isDisabled) return;
    const newCode = e.target.value;
    setSelectedCode(newCode);
    const rawNumber = displayValue.replace(/[^\d\s-]/g, "");
    if (rawNumber) {
      onChange(`${newCode} ${rawNumber}`.trim());
    } else {
      onChange(newCode); // Just set the code if they haven't typed a number yet
    }
  };

  if (mode === "view") {
    return (
      <div
        className={cn(
          "w-full text-sm font-medium text-foreground py-2",
          !safeValue && "text-muted-foreground italic",
          styles?.input,
          className
        )}
      >
        {safeValue || "—"}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center w-full min-w-0 bg-transparent gap-2",
        className
      )}
    >
      {/* Country Code Selector */}
      <div className="relative shrink-0 flex items-center">
        <select
          value={selectedCode}
          onChange={handleCodeChange}
          disabled={isDisabled || isReadOnly}
          className="appearance-none bg-transparent border-none outline-none ring-0 text-foreground font-medium pl-1 pr-6 py-1 cursor-pointer focus:ring-0 z-10"
        >
          {COUNTRY_CODES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label} ({c.code})
            </option>
          ))}
        </select>
        {/* Dropdown chevron */}
        <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>

      {/* Divider */}
      <div className="w-[1px] h-6 bg-border mx-1 shrink-0"></div>

      {/* Actual Phone Input */}
      <input
        ref={inputRef}
        id={resolvedId}
        name={resolvedName}
        type="tel"
        inputMode="tel"
        value={displayValue}
        onChange={handlePhoneChange}
        disabled={isDisabled}
        readOnly={isReadOnly}
        required={isRequired}
        aria-required={isRequired}
        placeholder={placeholderText}
        data-field-name={resolvedName}
        data-field-type={resolvedType}
        data-field-component={resolvedComponent}
        className={cn(
          "w-full flex-grow bg-transparent border-none outline-none ring-0 appearance-none min-w-0",
          "text-foreground placeholder:text-foreground/40 font-medium",
          "transition-all duration-500",
          styles?.input
        )}
        {...rest}
      />
    </div>
  );
});

PhoneField.displayName = "PhoneField";

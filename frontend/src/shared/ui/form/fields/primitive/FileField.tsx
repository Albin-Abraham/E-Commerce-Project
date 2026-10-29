import React, { useRef, useState } from "react";

import type { FormField } from "@ui/form/fields";
import type { FieldLayout } from "@ui/form/utils/form-layout-utils";
import { cn } from "@ui/form/utils/form-styles";
import { FileText, UploadCloud, X } from "lucide-react";

import type { AtomicFieldProps } from "./types";

export interface FileFieldProps extends Partial<AtomicFieldProps<any>> {
  field?: Partial<FormField>;
  onChange?: (val: any | undefined) => void;
  layout?: Partial<FieldLayout>;
  error?: boolean | string;
  className?: string;
  multiple?: boolean;
  accept?: string;
  variant?: "dropzone" | "compact";
  maxSizeMB?: number;
  styles?: { input?: string; [key: string]: string | undefined };
  [key: string]: unknown;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const FileField = React.forwardRef<HTMLInputElement, FileFieldProps>(
  (
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
      multiple: propMultiple,
      accept: propAccept,
      field,
      value,
      onChange,
      layout,
      error,
      className,
      styles,
      variant: propVariant,
      maxSizeMB: propMaxSizeMB,
      ...rest
    },
    ref
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => inputRef.current!);

    const resolvedName = name ?? field?.name;
    const resolvedType = type ?? field?.type ?? "file";
    const resolvedId = id ?? field?.id ?? resolvedName;
    const resolvedComponent =
      typeof component === "string"
        ? component
        : typeof field?.component === "string"
          ? field.component
          : "file";

    const isDisabled = Boolean(
      disabled ?? layout?.disabled ?? field?.disabled ?? false
    );
    const isReadOnly = Boolean(readOnly ?? layout?.readOnly ?? false);
    const isRequired = Boolean(required ?? field?.required);

    const isMultiple = Boolean(propMultiple ?? field?.properties?.multiple);
    const acceptTypes = propAccept ?? (field?.properties?.accept as string);
    const resolvedVariant = String(
      propVariant || (field?.properties as any)?.variant || "dropzone"
    );
    const maxSizeMB =
      propMaxSizeMB || (field?.properties as any)?.maxSizeMB || 10;

    const [isDragging, setIsDragging] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>(() => {
      if (!value) return [];
      if (Array.isArray(value)) return value;
      if (value instanceof FileList) return Array.from(value);
      if (value instanceof File) return [value];
      return [];
    });

    const handleFiles = (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const fileArray = Array.from(files);
      const newFiles = isMultiple
        ? [...selectedFiles, ...fileArray]
        : [fileArray[0]];
      setSelectedFiles(newFiles);
      onChange?.(isMultiple ? newFiles : newFiles[0]);
    };

    const handleRemoveFile = (index: number, e: React.MouseEvent) => {
      e.stopPropagation();
      const updated = selectedFiles.filter((_, i) => i !== index);
      setSelectedFiles(updated);
      onChange?.(
        isMultiple ? (updated.length > 0 ? updated : undefined) : undefined
      );
      if (inputRef.current) inputRef.current.value = "";
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isDisabled && !isReadOnly) setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (isDisabled || isReadOnly) return;
      handleFiles(e.dataTransfer.files);
    };

    return (
      <div className={cn("w-full flex flex-col gap-2.5", className)}>
        {/* Hidden Native Input */}
        <input
          type="file"
          ref={inputRef}
          id={resolvedId}
          name={resolvedName}
          disabled={isDisabled || isReadOnly}
          readOnly={isReadOnly}
          required={isRequired}
          aria-required={isRequired}
          onChange={(e) => handleFiles(e.target.files)}
          multiple={isMultiple}
          accept={acceptTypes}
          className="sr-only"
          data-field-name={resolvedName}
          data-field-type={resolvedType}
          data-field-component={resolvedComponent}
          aria-invalid={!!error}
          {...(rest as any)}
        />

        {/* Dropzone Card Surface */}
        {resolvedVariant === "dropzone" ? (
          <div
            onClick={() =>
              !isDisabled && !isReadOnly && inputRef.current?.click()
            }
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "relative flex flex-col items-center justify-center p-6 text-center rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer select-none",
              isDragging
                ? "border-primary bg-primary/10 scale-[1.01]"
                : "border-border/70 hover:border-primary/50 bg-surface/40 hover:bg-surface-elevated/70",
              error && "border-destructive/80 bg-destructive/5",
              isDisabled && "opacity-50 cursor-not-allowed pointer-events-none",
              styles?.input
            )}
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-foreground">
                <span className="text-primary hover:underline">
                  Click to upload
                </span>{" "}
                or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">
                {acceptTypes ? `Supported: ${acceptTypes}` : "Any file format"}{" "}
                (Max {maxSizeMB}MB)
              </p>
            </div>
          </div>
        ) : (
          /* Compact Button Trigger */
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isDisabled || isReadOnly}
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl border border-border bg-surface hover:bg-muted text-foreground transition-all duration-200 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-primary" />
              <span>Choose File{isMultiple ? "s" : ""}</span>
            </button>
            <span className="text-xs text-muted-foreground truncate">
              {selectedFiles.length > 0
                ? `${selectedFiles.length} file${selectedFiles.length > 1 ? "s" : ""} selected`
                : "No file chosen"}
            </span>
          </div>
        )}

        {/* Selected Files Chip List */}
        {selectedFiles.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-1">
            {selectedFiles.map((f, idx) => (
              <div
                key={`${f.name}-${idx}`}
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-surface-elevated/80 border border-border/60 text-xs shadow-2xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-medium text-foreground truncate">
                    {f.name}
                  </span>
                  <span className="text-muted-foreground text-[10px] shrink-0">
                    ({formatFileSize(f.size)})
                  </span>
                </div>
                {!isDisabled && !isReadOnly && (
                  <button
                    type="button"
                    aria-label={`Remove ${f.name}`}
                    onClick={(e) => handleRemoveFile(idx, e)}
                    className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-md transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

FileField.displayName = "FileField";

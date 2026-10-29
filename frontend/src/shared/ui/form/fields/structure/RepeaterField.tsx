import React from "react";

import { useVirtualizer } from "@tanstack/react-virtual";
import { FieldRenderer } from "@ui/form/FieldRenderer";
import { useFormRegistry } from "@ui/form/context/FormRegistryContext";
import { useFormTheme } from "@ui/form/context/FormThemeContext";
import type { FormField } from "@ui/form/fields";
import { getI18nString } from "@ui/form/utils/field-utils";
import { cn } from "@ui/form/utils/form-styles";
import { Plus, Trash2 } from "lucide-react";

import { useGridPermissions } from "@ui/form/context/PermissionContext";
import type { StructuralFieldProps } from "./types";

interface RepeaterFieldProps extends StructuralFieldProps {
  getComponentProps: (fieldId: string) => any;
  visibility?: Record<string, boolean>;
}

type CellPermission = "hidden" | "view" | "edit";

const PERMISSION_ORDER: Record<CellPermission, number> = {
  hidden: 0,
  view: 1,
  edit: 2,
};

export const RepeaterField = React.forwardRef<
  HTMLDivElement,
  RepeaterFieldProps
>(function RepeaterFieldInternal(
  { field, getComponentProps, visibility, styles },
  forwardedRef
) {
  // 1. Context & State
  const { value, onChange, error, errorMessage } = getComponentProps(field.id);
  const { form } = useFormRegistry();
  const theme = useFormTheme();
  const isCompact = theme.density === "compact";

  const {
    getColumnPermission,
    getRowPermission,
    getCellPermission,
  } = useGridPermissions();

  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useImperativeHandle(
    forwardedRef,
    () => containerRef.current as HTMLDivElement
  );

  const items: unknown[] = Array.isArray(value) ? value : [];
  const templates = field.fields ?? [];

  const parentPath = field.name;
  const fieldLabel = getI18nString(field.label);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => (isCompact ? 52 : 72),
    overscan: 5,
    getItemKey: (index) => index,
  });

  const cellPadding = isCompact
    ? "px-3 py-1.5"
    : "px-4 py-3";

  const headerPadding = isCompact
    ? "px-3 py-2"
    : "px-4 py-3";

  const visibleTemplates = React.useMemo(
    () =>
      templates.filter((template: FormField) => {
        if (
          visibility &&
          visibility[template.id] === false
        ) {
          return false;
        }

        return getColumnPermission(template.name) !== "hidden";
      }),
    [templates, visibility, getColumnPermission]
  );

  const handleAddItem = React.useCallback(() => {
    const nextIndex = items.length;
    if (form) {
      form.appendRow(field.name, {});
    } else {
      onChange([...items, {}]);
    }
    requestAnimationFrame(() => {
      virtualizer.scrollToIndex(nextIndex, {
        align: "end",
      });
    });
  }, [form, field.name, items, onChange, virtualizer]);

  const handleRemoveItem = React.useCallback(
    (index: number) => {
      if (form) {
        form.removeRow(field.name, index);
      } else {
        onChange(items.filter((_, itemIndex) => itemIndex !== index));
      }
    },
    [form, field.name, items, onChange]
  );

  const renderHeader = () => {
    if (visibleTemplates.length === 0) {
      return null;
    }

    return (
      <div className="sticky top-0 z-[var(--z-overlap)] flex w-full border-b border-border bg-subtle/80 backdrop-blur-sm dark:bg-gray-800/50">
        {visibleTemplates.map((template: FormField) => (
          <div
            key={template.id || template.name}
            className={cn(
              headerPadding,
              "min-w-0 flex-1 text-left text-xs font-bold uppercase tracking-tight text-foreground/50"
            )}
          >
            {getI18nString(template.label)}

            {template.required && (
              <span className="ml-1 text-red-500">*</span>
            )}
          </div>
        ))}

        <div
          className={cn(
            headerPadding,
            "w-12 flex-shrink-0"
          )}
        >
          <span className="sr-only">Actions</span>
        </div>
      </div>
    );
  };

  const renderRow = (
    index: number,
    virtualRow: (typeof virtualizer.getVirtualItems)[number] extends never
      ? never
      : ReturnType<typeof virtualizer.getVirtualItems>[number]
  ) => {
    const rowData = items[index];
    const rowPermission = getRowPermission(rowData, index);

    const rowStyle: React.CSSProperties = {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      transform: `translateY(${virtualRow.start}px)`,
    };

    if (rowPermission === "hidden") {
      return (
        <div
          key={virtualRow.key}
          data-index={index}
          ref={virtualizer.measureElement}
          style={{
            ...rowStyle,
            height: virtualRow.size,
          }}
          aria-hidden="true"
        />
      );
    }

    return (
      <div
        key={virtualRow.key}
        data-index={index}
        ref={virtualizer.measureElement}
        style={rowStyle}
        className="group flex border-b border-border/50 transition-colors duration-200 hover:bg-blue-50/30 dark:hover:bg-blue-900/10"
      >
        {visibleTemplates.map((template: FormField) => {
          const dynamicId =
            `${parentPath}[${index}].${template.name}`;

          const childField: FormField = {
            ...template,
            id: dynamicId,
            name: dynamicId,
          };

          const columnPermission =
            getColumnPermission(template.name);

          const cellPermission = getCellPermission(
            rowData,
            template.name,
            index
          );

          const effectivePermission: CellPermission =
            PERMISSION_ORDER[columnPermission] <=
            PERMISSION_ORDER[cellPermission]
              ? columnPermission
              : cellPermission;

          if (effectivePermission === "hidden") {
            return (
              <div
                key={dynamicId}
                className={cn(cellPadding, "min-w-0 flex-1")}
                aria-hidden="true"
              />
            );
          }

          return (
            <div
              key={dynamicId}
              className={cn(
                cellPadding,
                "min-w-0 flex-1 align-top"
              )}
            >
              <FieldRenderer
                field={childField}
                showLabel={false}
                className="!mb-0"
                density={isCompact ? "compact" : undefined}
                disabled={effectivePermission === "view"}
              />
            </div>
          );
        })}

        <div
          className={cn(
            cellPadding,
            "w-12 flex-shrink-0 text-right align-top"
          )}
        >
          <button
            type="button"
            onClick={() => handleRemoveItem(index)}
            className="rounded-lg p-2 text-gray-400 transition-all duration-200 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
            aria-label={`Remove item ${index + 1}`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      id={field.id}
      className={cn(
        "w-full space-y-4 overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition-all duration-300 dark:bg-transparent",
        styles?.base
      )}
    >
      {(fieldLabel || field.description) && (
        <div className="border-b border-border bg-subtle/30 p-4 dark:bg-subtle/20">
          <div className="flex items-center justify-between">
            <div>
              {fieldLabel && (
                <h4 className="text-base font-semibold text-foreground">
                  {fieldLabel}
                </h4>
              )}

              {field.description && (
                <div className="mt-1 text-xs text-foreground/50">
                  {getI18nString(field.description)}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <span className="rounded-md bg-foreground/5 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-foreground/30">
                {items.length} Entries
              </span>
            )}
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className="relative max-h-[500px] overflow-x-auto overflow-y-auto scrollbar-thin scrollbar-thumb-foreground/20"
      >
        <div className="min-w-[600px] w-full">
          {renderHeader()}

          <div
            className="relative w-full"
            style={{
              height: `${virtualizer.getTotalSize()}px`,
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) =>
              renderRow(virtualRow.index, virtualRow)
            )}
          </div>
        </div>

        {items.length === 0 && (
          <div
            role="status"
            className="flex flex-col items-center justify-center bg-surface px-4 py-12 text-center text-foreground/40 dark:bg-transparent"
          >
            <div className="mb-3 rounded-full bg-surface p-3 shadow-[var(--shadow-etched)]">
              <Plus size={24} className="opacity-20" />
            </div>

            <p className="text-sm font-medium">
              No items added yet.
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-border bg-subtle/30 p-4 dark:bg-subtle/20">
        <button
          type="button"
          onClick={handleAddItem}
          className="flex items-center gap-2 rounded-xl border border-primary/20 px-5 py-2.5 text-sm font-bold text-primary transition-all duration-300 hover:bg-primary/5"
        >
          <Plus size={18} />
          {fieldLabel ? `Add New ${fieldLabel}` : "Add Item"}
        </button>
      </div>

      {error && errorMessage && (
        <div className="px-4 pb-4">
          <p
            className="flex items-center gap-2 text-sm text-red-500"
            role="alert"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            {errorMessage}
          </p>
        </div>
      )}
    </div>
  );
});

RepeaterField.displayName = "RepeaterField";

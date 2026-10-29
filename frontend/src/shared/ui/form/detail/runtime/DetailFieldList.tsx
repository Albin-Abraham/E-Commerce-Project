import React from "react";
import { useTranslation } from "react-i18next";

import { tokens } from "@shared/theme";
import { defaultRegistry } from "@ui/form/fields/lazy-registry-builder";
import type { FormField } from "@ui/form/types";
import {
  getFieldOptions,
  getFieldPlaceholder,
} from "@ui/form/utils/form-layout-utils";
import { resolveTranslation } from "@ui/form/utils/i18n.utils";
import { cn } from "@ui/form/utils/form-styles";

import { DetailKeyDetailsCard } from "../components/DetailKeyDetailsCard";
import { DetailKeyValueRow } from "../components/DetailKeyValueRow";
import { DetailValueDisplay } from "../components/DetailValueDisplay";
import type { DetailRendererSlots } from "../types";

export interface DetailFieldListProps<T = any> {
  nodes: FormField[];
  data: T;
  layoutStyle?: "cards" | "key-value" | "flat";
  slots?: DetailRendererSlots<T>;
  visibility?: Record<string, boolean>;
  getComponentProps: (fieldId: string) => any;
  defTitle?: string | Record<string, any>;
  fallback?: React.ReactNode;
  suspense?: boolean;
  virtualized?: boolean;
  maxDisplayRows?: number;
}

export function DetailFieldList<T extends Record<string, any>>({
  nodes,
  data,
  layoutStyle = "cards",
  slots = {},
  visibility,
  getComponentProps,
  defTitle,
  fallback,
  suspense,
  virtualized = false,
  maxDisplayRows = 50,
}: DetailFieldListProps<T>) {
  const { t } = useTranslation("features/forms");

  const isVirtual = virtualized || nodes.length > maxDisplayRows;

  const buildFieldList = (
    fieldList: FormField[],
    visibilityMap?: Record<string, boolean>
  ): React.ReactNode => {
    return (
      <div
        className={cn(
          "flex flex-col w-full",
          isVirtual &&
            "max-h-[600px] overflow-y-auto overscroll-contain pr-1 divide-y divide-border/30"
        )}
        data-slot={isVirtual ? "virtualized-viewport" : undefined}
        role={isVirtual ? "region" : undefined}
        aria-label={isVirtual ? "Virtualized fields list" : undefined}
      >
        {fieldList.map((field) => {
          if (visibilityMap && visibilityMap[field.id] === false) {
            return null;
          }

          // Container / Section with children: recurse into child fields
          const childFields =
            field.fields ?? (field as { children?: FormField[] }).children;
          if (Array.isArray(childFields) && childFields.length > 0) {
            const sectionTitle =
              field.label && field.label !== field.id
                ? typeof field.label === "string"
                  ? field.label
                  : resolveTranslation(field.label)
                : undefined;

            return (
              <div key={field.id} className="pt-2 pb-4 first:pt-0">
                {sectionTitle && (
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/90 pt-3 pb-2">
                    {sectionTitle}
                  </h3>
                )}
                {buildFieldList(childFields, visibilityMap)}
              </div>
            );
          }

          // Slot resolution mirrors FieldRouter: schema component overrides
          // are only honored for slot fields; the slots map may target any
          // field. String values resolve through the field registry so a
          // registry key can never be rendered as a native DOM element.
          const isSlot =
            field.type === "slot" ||
            (field as { routing?: string }).routing === "slot";
          const fieldName = field.name ?? field.id;
          const slotCandidate = isSlot
            ? (field.meta?.ui?.component ??
              slots[fieldName] ??
              slots[field.id])
            : (slots[fieldName] ?? slots[field.id]);
          const SlotComp =
            typeof slotCandidate === "string"
              ? defaultRegistry.get(slotCandidate)
              : slotCandidate;

          // 1. Direct Slot Field Injection
          if (isSlot || SlotComp) {
            if (React.isValidElement(SlotComp)) {
              return (
                <div key={field.id} className="py-3">
                  {SlotComp}
                </div>
              );
            }
            if (SlotComp) {
              const Comp = SlotComp as React.ComponentType<any>;
              const val =
                data[fieldName] !== undefined
                  ? data[fieldName]
                  : (data as any)[field.id];
              return (
                <div key={field.id} className="py-3">
                  <Comp
                    field={field}
                    value={val}
                    data={data}
                    onChange={getComponentProps(field.id)?.onChange}
                  />
                </div>
              );
            }
          }

          // 2. Static Header Field
          if (field.type === "header" || field.type === "title") {
            const headingText = field.label
              ? resolveTranslation(field.label)
              : "";
            return (
              <div key={field.id} className="pt-4 pb-2">
                <h3 className={tokens.detail.section.staticHeader}>
                  {headingText}
                </h3>
              </div>
            );
          }

          // 3. Static Divider Field
          if (field.type === "divider") {
            return (
              <div key={field.id} className="py-2">
                <hr className={tokens.detail.section.divider} />
              </div>
            );
          }

          // 4. Regular Data Field Presentation
          const fieldLabel = field.label
            ? typeof field.label === "string"
              ? field.label
              : resolveTranslation(field.label)
            : field.name;

          const fieldValue =
            data[fieldName] !== undefined
              ? data[fieldName]
              : (data as any)[field.id];
          const fieldOptions = getFieldOptions(field);
          const fieldDescription = (field.properties?.description ||
            getFieldPlaceholder(field)) as string | undefined;
          const currency = (field.properties?.currency ||
            field.meta?.currency) as string | undefined;

          return (
            <DetailKeyValueRow
              key={field.id}
              label={fieldLabel}
              description={fieldDescription}
              value={
                <DetailValueDisplay
                  value={fieldValue}
                  type={field.type}
                  options={fieldOptions}
                  currency={currency}
                  format={field.properties?.format as string | undefined}
                />
              }
            />
          );
        })}
      </div>
    );
  };

  const fieldListContent = buildFieldList(nodes, visibility);

  if (layoutStyle === "cards") {
    const sectionNodes = nodes.filter(
      (n) =>
        (n.type === "section" || Array.isArray(n.fields)) &&
        (n.fields?.length || 0) > 0
    );

    if (sectionNodes.length > 1) {
      return (
        <div className="flex flex-col gap-6 w-full">
          {sectionNodes.map((secNode) => {
            const childFields =
              secNode.fields ?? (secNode as any).children ?? [];
            const secTitle = secNode.label
              ? typeof secNode.label === "string"
                ? secNode.label
                : resolveTranslation(secNode.label)
              : undefined;
            const secDesc = (secNode.properties?.description ||
              (secNode as any).description) as string | undefined;

            return (
              <DetailKeyDetailsCard
                key={secNode.id}
                title={secTitle}
                subtitle={secDesc}
                fallback={fallback}
                suspense={suspense}
              >
                {buildFieldList(childFields, visibility)}
              </DetailKeyDetailsCard>
            );
          })}
        </div>
      );
    }

    const cardTitle = defTitle
      ? undefined
      : t("detail.keyDetails", { defaultValue: "Key Details" });
    return (
      <DetailKeyDetailsCard
        title={cardTitle}
        fallback={fallback}
        suspense={suspense}
      >
        {fieldListContent}
      </DetailKeyDetailsCard>
    );
  }

  return <>{fieldListContent}</>;
}

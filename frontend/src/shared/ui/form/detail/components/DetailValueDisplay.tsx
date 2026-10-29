import React from "react";
import { useTranslation } from "react-i18next";
import { Check, X } from "lucide-react";

import { tokens } from "@shared/theme";
import { cn } from "@ui/form/utils/form-styles";
import { getIcon } from "@ui/form/utils/icon-registry";

import { normalizeDisplayModel } from "../formatters/display-model";
import type { ValueDisplayProps } from "../types";

/**
 * Value Display Component.
 * Formats booleans, options, numbers, currency, dates, and arrays cleanly and securely.
 */
export function DetailValueDisplay({
  value,
  type,
  options,
  format,
  currency,
  emptyPlaceholder = "—",
  className,
}: ValueDisplayProps) {
  const { t, i18n } = useTranslation("features/forms");
  const locale = i18n?.language || "en-US";
  const displayTokens = tokens.detail.display;

  const model = normalizeDisplayModel(
    value,
    type,
    options,
    format,
    currency,
    locale,
    emptyPlaceholder
  );

  switch (model.kind) {
    case "empty":
      return (
        <span className={cn(displayTokens.empty, className)}>
          {model.text}
        </span>
      );

    case "boolean":
      return (
        <span
          className={cn(
            displayTokens.boolean,
            model.isTrue ? displayTokens.booleanTrue : displayTokens.booleanFalse,
            className
          )}
        >
          {model.isTrue ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
          {model.isTrue
            ? t("detail.yes", { defaultValue: "Yes" })
            : t("detail.no", { defaultValue: "No" })}
        </span>
      );

    case "option": {
      const OptionIconComp = model.icon ? getIcon(model.icon) : null;
      return (
        <span className={cn(displayTokens.optionPill, className)}>
          {OptionIconComp && (
            <OptionIconComp className="w-3.5 h-3.5 shrink-0" />
          )}
          <span>{model.label}</span>
        </span>
      );
    }

    case "email":
      if (!model.isSafe) {
        return (
          <span className={cn("text-foreground", className)}>{model.label}</span>
        );
      }
      return (
        <a href={model.href} className={cn(displayTokens.link, className)}>
          {model.label}
        </a>
      );

    case "phone":
      if (!model.isSafe) {
        return (
          <span className={cn("text-foreground", className)}>{model.label}</span>
        );
      }
      return (
        <a href={model.href} className={cn(displayTokens.link, className)}>
          {model.label}
        </a>
      );

    case "url":
      if (!model.isSafe) {
        return (
          <span className={cn("text-foreground font-mono text-xs", className)}>
            {model.label}
          </span>
        );
      }
      return (
        <a
          href={model.href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(displayTokens.link, className)}
        >
          {model.label}
        </a>
      );

    case "image":
      return (
        <img
          src={model.src}
          alt="Preview"
          className={cn(displayTokens.image, className)}
        />
      );

    case "array":
      return (
        <div className={cn("flex flex-wrap gap-1.5", className)}>
          {model.items.map((item, idx) => (
            <span
              key={idx}
              className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted border border-border/60 text-xs font-medium text-foreground"
            >
              {String(item)}
            </span>
          ))}
        </div>
      );

    case "currency":
      return (
        <span className={cn("font-semibold text-foreground", className)}>
          {model.text}
        </span>
      );

    case "date":
      return <span className={cn("text-foreground", className)}>{model.text}</span>;

    case "text":
    default:
      return <span className={cn("text-foreground", className)}>{model.text}</span>;
  }
}

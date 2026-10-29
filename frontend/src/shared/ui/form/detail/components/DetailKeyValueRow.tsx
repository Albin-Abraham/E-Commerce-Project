import React from "react";

import { tokens } from "@shared/theme";
import { cn } from "@ui/form/utils/form-styles";

import type { KeyValueRowProps } from "../types";

/**
 * Key-Value Detail Row.
 * Renders label and value in high-contrast detail pair with horizontal or vertical orientation.
 */
export function DetailKeyValueRow({
  label,
  value,
  description,
  orientation = "horizontal",
  className,
}: KeyValueRowProps) {
  const isHoriz = orientation === "horizontal";
  const rowTokens = tokens.detail.row;

  return (
    <div
      data-slot="key-value-row"
      className={cn(
        rowTokens.base,
        isHoriz ? rowTokens.horizontal : rowTokens.vertical,
        className
      )}
    >
      <div className="flex flex-col">
        <span className={rowTokens.label}>{label}</span>
        {description && (
          <span className={rowTokens.description}>{description}</span>
        )}
      </div>

      <div
        className={cn(
          rowTokens.value,
          isHoriz && rowTokens.valueRight
        )}
      >
        {value}
      </div>
    </div>
  );
}

import React from "react";

import { tokens } from "@shared/theme";
import { cn } from "@ui/form/utils/form-styles";
import { getIcon } from "@ui/form/utils/icon-registry";

import type { HeaderRendererProps } from "../types";

/**
 * Concentric Hero Header Slot Renderer.
 * Features concentric icon badge, headline typography, optional status pill, and metadata tags.
 */
export function DetailHeader({
  title,
  subtitle,
  badgeIcon,
  status,
  tags,
  className,
  children,
}: HeaderRendererProps) {
  const IconComp = typeof badgeIcon === "string" ? getIcon(badgeIcon) : null;
  const hasIcon = Boolean(IconComp || React.isValidElement(badgeIcon));

  const headerTokens = tokens.detail.header;
  const statusVariantClasses: Record<string, string> = tokens.form.status;

  return (
    <div
      data-slot="detail-header"
      className={cn(headerTokens.container, className)}
    >
      <div className="flex items-center gap-4">
        {hasIcon && (
          <div className={headerTokens.iconBadge.outer}>
            <div className={headerTokens.iconBadge.inner}>
              {IconComp ? (
                <IconComp className={headerTokens.iconBadge.icon} />
              ) : (
                (badgeIcon as React.ReactNode)
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className={headerTokens.title}>{title}</h1>
            {status && (
              <span
                className={cn(
                  headerTokens.statusBadge,
                  statusVariantClasses[status.variant || "default"]
                )}
              >
                {status.label}
              </span>
            )}
          </div>

          {subtitle && <p className={headerTokens.subtitle}>{subtitle}</p>}

          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {tags.map((tag) => (
                <span key={tag} className={headerTokens.tag}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {children && (
        <div className="flex items-center gap-2.5 shrink-0 self-stretch md:self-auto">
          {children}
        </div>
      )}
    </div>
  );
}

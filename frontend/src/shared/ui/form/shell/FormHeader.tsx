import React, { useEffect } from "react";

import { tokens } from "@shared/theme";
import { cn } from "@ui/form/utils/form-styles";
import { resolveTranslation } from "@ui/form/utils/i18n.utils";
import { getIcon } from "@ui/form/utils/icon-registry";

import { useLayout } from "../context/LayoutContext";
import type { FormDefinition } from "../types";

export type FormHeaderProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "children" | "className"
> & {
  definition: FormDefinition;
  sticky?: boolean;
  className?: string;
  slots?: Record<string, string>;
  children?: React.ReactNode; // Custom slots
  prefix?: React.ReactNode; // Logo/Back button slot
};

export const FormHeader: React.FC<FormHeaderProps> = ({
  definition,
  className,
  slots = {},
  children,
  prefix,
  ...props
}) => {
  const { title, description } = definition;
  const { isPageHeaderActive, setPageTitle, setPageDescription } = useLayout();

  // Enroll with Page context
  useEffect(() => {
    if (isPageHeaderActive) {
      const t = resolveTranslation(title);
      const d = resolveTranslation(description);
      if (t) setPageTitle(t);
      if (d) setPageDescription(d);
    }
  }, [
    isPageHeaderActive,
    title,
    description,
    setPageTitle,
    setPageDescription,
  ]);

  // If the Page Shell or explicit settings is handling the Header, yield and hide locally.
  if (isPageHeaderActive || definition.settings?.hideHeader) return null;

  // Resolve optional icon badge
  const iconCandidate =
    (definition as any).badgeIcon ||
    definition.meta?.ui?.icon ||
    (definition.properties as any)?.icon;
  const IconComp =
    typeof iconCandidate === "string" ? getIcon(iconCandidate) : null;
  const hasIcon = Boolean(IconComp || React.isValidElement(iconCandidate));

  // Resolve optional status badge
  const status = (definition.meta?.ui as any)?.status;
  const headerTokens = tokens.form.shell.header;
  const statusVariantClasses: Record<string, string> = tokens.form.status;

  // Do not render empty header if there is no content
  if (!title && !description && !prefix && !children && !hasIcon) return null;

  return (
    <div
      className={cn(
        headerTokens.container,
        slots.header,
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-4 flex-grow">
        {prefix && <div className="form-header__prefix shrink-0">{prefix}</div>}

        {!prefix && hasIcon && (
          <div className={headerTokens.iconBadgeOuter}>
            <div className={headerTokens.iconBadgeInner}>
              {IconComp ? (
                <IconComp className={headerTokens.icon} />
              ) : (
                (iconCandidate as React.ReactNode)
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1 flex-grow min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            {title && (
              <h1
                className={cn(
                  headerTokens.title,
                  slots.title
                )}
              >
                {resolveTranslation(title)}
              </h1>
            )}

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

          {description && (
            <p
              className={cn(
                headerTokens.description,
                slots.description
              )}
            >
              {resolveTranslation(description)}
            </p>
          )}
        </div>
      </div>

      {children && (
        <div className="form-header__extra ml-auto self-center shrink-0">
          {children}
        </div>
      )}
    </div>
  );
};

import React from "react";
import { cn } from "@libs/utils";

export interface SkipLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  targetId?: string;
  children?: React.ReactNode;
}

/**
 * SkipLink: Primary document navigation accessibility feature.
 *
 * Hidden until focused via keyboard Tab navigation, allowing screen reader
 * and keyboard users to bypass repetitive navigation landmarks directly to #main-content.
 */
export const SkipLink = React.forwardRef<HTMLAnchorElement, SkipLinkProps>(
  ({ targetId = "#main-content", className, children, ...props }, ref) => {
    return (
      <a
        ref={ref}
        href={targetId.startsWith("#") ? targetId : `#${targetId}`}
        data-testid="skip-link"
        className={cn(
          "sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999]",
          "focus:px-4 focus:py-2.5 focus:rounded-lg focus:bg-background focus:text-foreground",
          "focus:font-medium focus:text-sm focus:shadow-xl focus:border focus:border-border",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
          "transition-all duration-200",
          className
        )}
        {...props}
      >
        {children || "Skip to main content"}
      </a>
    );
  }
);

SkipLink.displayName = "SkipLink";

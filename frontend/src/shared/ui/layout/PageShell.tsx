import React from "react";

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
  slots?: {
    shell?: string;
    atmosphere?: string;
  };
}

/**
 * PageShell: The "Dumb" structural Chassis for all Orchestrated Views.
 * Provides the premium atmosphere (blurs/glows) and layout constraints.
 */
export const PageShell: React.FC<PageShellProps> = ({
  children,
  className = "",
  slots = {},
}) => {
  // Use slots from engine or fallback to unstyled
  const shellClass =
    slots.shell || "page-shell--dashboard w-full h-full flex flex-col relative";

  return <div className={`${shellClass} ${className}`}>{children}</div>;
};

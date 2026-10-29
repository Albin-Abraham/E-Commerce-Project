import React from "react";

import { type AppRoute } from "@core/router/route.types";

import { Zenith } from "@shared/theme";

interface PageLayoutProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  variant?: "default" | "narrow" | "wide";
  route?: AppRoute;
}

/**
 * PageLayout
 *
 * Industrial-grade page orchestrator that standardizes the outer wrapper,
 * vertical spacing, typography, and scroll anchoring across the platform.
 */
export const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  description,
  children,
  variant = "default",
  route,
}) => {
  // Resolve metadata from route if available
  const displayTitle = (title || route?.meta?.title || "") as string;
  const displayDescription = (description ||
    route?.meta?.description ||
    "") as string;

  return (
    <section {...Zenith.section("page-content")} className="min-h-full">
      <div
        {...Zenith.container()}
        className={Zenith.cn(
          Zenith.container().className,
          "py-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700",
          variant === "narrow"
            ? "max-w-4xl"
            : variant === "wide"
              ? "max-w-none"
              : ""
        )}
      >
        {(displayTitle || displayDescription) && (
          <header className="flex flex-col gap-2 mb-10 border-b border-border/10 pb-8">
            {displayTitle && displayTitle.length > 0 && (
              <h1 className={Zenith.text("h1")}>
                {displayTitle.split(" ").map((word, i) => (
                  <span key={i} className={i === 1 ? "text-primary" : ""}>
                    {word}{" "}
                  </span>
                ))}
              </h1>
            )}
            {displayDescription && displayDescription.length > 0 && (
              <p className={Zenith.text("body") + " opacity-60 max-w-3xl"}>
                {displayDescription}
              </p>
            )}
          </header>
        )}

        <main className="relative z-10">{children}</main>
      </div>
    </section>
  );
};

export default PageLayout;

import React from "react";
import { useMatches, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { useBreadcrumbResolution } from "@core/router/hooks/useBreadcrumbResolution";
import type {
  BreadcrumbItem,
  BreadcrumbsProp,
} from "@core/router/types/breadcrumb.types";
import { Zenith } from "@shared/theme";

import { Breadcrumbs } from "./Breadcrumbs";

export interface PageHeaderProps {
  /** Main page title */
  title: React.ReactNode;
  /** Optional descriptive subtitle */
  subtitle?: React.ReactNode;
  /** Optional status or metric badge */
  badge?: React.ReactNode;
  /**
   * Breadcrumbs configuration:
   * - Omitted/undefined: Automatically resolves from router match hierarchy
   * - BreadcrumbItem[]: Explicit manual override
   * - Function: Transform / append to the automatically resolved trail
   */
  breadcrumbs?: BreadcrumbsProp;
  /** Primary and secondary action buttons slot */
  actions?: React.ReactNode;
  /** Declarative detail matrix or telemetry slot */
  detail?: React.ReactNode;
  /** Navigation or filter tabs */
  tabs?: React.ReactNode;
  /** Additional utility controls (e.g. refresh, time filter) */
  utility?: React.ReactNode;
  /** Optional back button action or destination route */
  onBack?: (() => void) | string;
  /** Additional CSS class */
  className?: string;
  children?: React.ReactNode;
}

/**
 * PageHeader
 *
 * Enterprise Page Header shell orchestrating spatial breadcrumb trails,
 * action matrix slots, detail slots, tab navigation, and live telemetry widgets.
 */
export const PageHeader: React.FC<PageHeaderProps> & {
  Actions: typeof PageHeaderActions;
  DetailSlot: typeof PageHeaderDetailSlot;
  Tabs: typeof PageHeaderTabs;
  Tab: typeof PageHeaderTab;
  Utility: typeof PageHeaderUtility;
} = ({
  title,
  subtitle,
  badge,
  breadcrumbs: breadcrumbsProp,
  actions,
  detail,
  tabs,
  utility,
  onBack,
  className,
  children,
}) => {
  let matches: any[] = [];
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    matches = useMatches() as any[];
  } catch {
    // Fallback when used outside DataRouter context
    matches = [];
  }
  const { status, crumbs: autoCrumbs } = useBreadcrumbResolution(matches);
  const navigate = useNavigate();

  // Resolve final breadcrumb segments (Auto vs Manual vs Hybrid Function)
  let resolvedBreadcrumbs: BreadcrumbItem[] = [];
  if (typeof breadcrumbsProp === "function") {
    resolvedBreadcrumbs = breadcrumbsProp(autoCrumbs);
  } else if (Array.isArray(breadcrumbsProp)) {
    resolvedBreadcrumbs = breadcrumbsProp;
  } else {
    resolvedBreadcrumbs = autoCrumbs;
  }

  const handleBack = () => {
    if (typeof onBack === "function") {
      onBack();
    } else if (typeof onBack === "string") {
      navigate(onBack);
    } else {
      navigate(-1);
    }
  };

  return (
    <header
      data-testid="page-header"
      className={Zenith.cn(
        "flex flex-col gap-4 p-6 lg:p-8 bg-card/80 dark:bg-card/40 backdrop-blur-md border-b border-border/40 shrink-0",
        className
      )}
    >
      {/* 1. Spatial Breadcrumbs Row */}
      {resolvedBreadcrumbs.length > 0 && (
        <div className="flex items-center justify-between gap-4">
          <Breadcrumbs
            items={resolvedBreadcrumbs}
            loading={status === "loading"}
          />
        </div>
      )}

      {/* 2. Main Title, Subtitle, and Action Matrix */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={handleBack}
              className="p-2 rounded-xl border border-border/40 hover:bg-muted/40 transition-colors text-muted-foreground hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label="Go back"
            >
              <ArrowLeft size={18} />
            </button>
          )}

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-foreground">
                {title}
              </h1>
              {badge && (
                <div className="inline-flex items-center">
                  {typeof badge === "string" || typeof badge === "number" ? (
                    <span className="px-2.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-black">
                      {badge}
                    </span>
                  ) : (
                    badge
                  )}
                </div>
              )}
            </div>
            {subtitle && (
              <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex items-center gap-3 flex-wrap">{actions}</div>
        )}
      </div>

      {/* 3. Declarative Detail / Telemetry Slot */}
      {detail && <div className="pt-2">{detail}</div>}

      {/* 4. Optional Tabs and Utility Bar */}
      {(tabs || utility) && (
        <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/20 flex-wrap">
          {tabs && <div className="flex items-center">{tabs}</div>}
          {utility && <div className="flex items-center gap-3 ml-auto">{utility}</div>}
        </div>
      )}

      {children}
    </header>
  );
};

function PageHeaderDetailSlot({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={Zenith.cn("w-full transition-all", className)}>
      {children}
    </div>
  );
}

function PageHeaderActions({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={Zenith.cn("flex items-center gap-2.5 flex-wrap", className)}>
      {children}
    </div>
  );
}

function PageHeaderTabs({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={Zenith.cn(
        "flex items-center gap-1 bg-muted/30 p-1 rounded-xl border border-border/30",
        className
      )}
    >
      {children}
    </div>
  );
}

function PageHeaderTab({
  children,
  active,
  icon: Icon,
  badge,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  icon?: React.ElementType;
  badge?: string | number;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={Zenith.cn(
        "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all outline-none",
        active
          ? "bg-card text-foreground shadow-xs"
          : "text-muted-foreground hover:text-foreground hover:bg-card/40"
      )}
    >
      {Icon && <Icon size={14} />}
      <span>{children}</span>
      {badge !== undefined && (
        <span
          className={Zenith.cn(
            "px-1.5 py-0.2 rounded-full text-[10px] font-black",
            active
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          )}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function PageHeaderUtility({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={Zenith.cn("flex items-center gap-3", className)}>
      {children}
    </div>
  );
}

PageHeader.Actions = PageHeaderActions;
PageHeader.DetailSlot = PageHeaderDetailSlot;
PageHeader.Tabs = PageHeaderTabs;
PageHeader.Tab = PageHeaderTab;
PageHeader.Utility = PageHeaderUtility;

export default PageHeader;

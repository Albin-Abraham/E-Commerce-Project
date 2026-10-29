import React, { useId } from "react";

import { useFormRegistry } from "@ui/form/context/FormRegistryContext";
import { useTabsNode } from "@ui/form/context/LayoutManagerContext";
import { cn } from "@ui/form/utils/form-styles";
import { resolveTranslation } from "@ui/form/utils/i18n.utils";
import { AnimatePresence, m } from "framer-motion";

import type { StructuralFieldProps } from "./types";

export interface TabDefinition {
  id: string;
  label: string;
  /** Optional icon class (e.g. iconify class) */
  icon?: string;
  /** Optional badge count */
  badge?: number;
  /** Whether this tab is disabled */
  disabled?: boolean;
}

/**
 * TabsField
 *
 * A full tab panel renderer for structural sections.
 * Each child `FormField` (of any type) becomes a tab panel, using `field.label` as the tab title.
 *
 * Implements ARIA tabs pattern (role="tablist" / role="tab" / role="tabpanel")
 * with keyboard navigation (ArrowLeft/Right, Home/End).
 *
 * ## Schema Usage
 * ```ts
 * {
 *   key: "settings",
 *   type: "section",
 *   label: "Settings",
 *   layout: { type: "tabs" },
 *   fields: [
 *     {
 *       key: "general",
 *       type: "section",
 *       label: "General",
 *       fields: [{ key: "name", type: "text", label: "Name" }]
 *     },
 *     {
 *       key: "security",
 *       type: "section",
 *       label: "Security",
 *       fields: [{ key: "password", type: "password", label: "Password" }]
 *     }
 *   ]
 * }
 * ```
 */
export const TabsField: React.FC<
  StructuralFieldProps & {
    children?: React.ReactNode;
    tabs?: TabDefinition[];
    activeTab?: string;
    onTabChange?: (tabId: string) => void;
  }
> = ({
  field,
  children,
  tabs: externalTabs,
  activeTab: controlled,
  onTabChange,
  className,
  styles,
}) => {
  const instanceId = useId();
  const { i18nNamespace } = useFormRegistry();

  // Derive tabs from child fields if not provided externally
  const childFields = field.fields ?? [];
  const tabs: TabDefinition[] =
    externalTabs ??
    childFields.map((f) => ({
      id: f.id,
      label: resolveTranslation(f.label, i18nNamespace) ?? f.id,
      icon: (f.meta?.ui as any)?.icon,
      badge: f.customData?.badge,
      disabled: f.enabled === false,
    }));

  // Phase 3: Register with LayoutManager — enables imperative control
  // (e.g., layoutManager.tabs.setActiveTab(field.id, tabId) from FormValidator)
  const { activeTab: managedActiveTab, setActiveTab: setManagedActiveTab } =
    useTabsNode(field.id, tabs[0]?.id ?? "");

  // Honour controlled prop if passed, otherwise use LayoutManager state
  const activeTabId = controlled ?? managedActiveTab;

  const handleSelect = (id: string, shouldFocus = false) => {
    setManagedActiveTab(id);
    onTabChange?.(id);
    if (shouldFocus) {
      setTimeout(() => {
        document.getElementById(`${instanceId}-tab-${id}`)?.focus();
      }, 0);
    }
  };

  // Keyboard navigation with roving focus
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const enabledTabs = tabs.filter((t) => !t.disabled);
    const currentEnabledIndex = enabledTabs.findIndex(
      (t) => t.id === tabs[index].id
    );

    if (e.key === "ArrowRight") {
      e.preventDefault();
      const next = enabledTabs[(currentEnabledIndex + 1) % enabledTabs.length];
      if (next) handleSelect(next.id, true);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prev =
        enabledTabs[
          (currentEnabledIndex - 1 + enabledTabs.length) % enabledTabs.length
        ];
      if (prev) handleSelect(prev.id, true);
    } else if (e.key === "Home") {
      e.preventDefault();
      if (enabledTabs[0]) handleSelect(enabledTabs[0].id, true);
    } else if (e.key === "End") {
      e.preventDefault();
      if (enabledTabs[enabledTabs.length - 1])
        handleSelect(enabledTabs[enabledTabs.length - 1].id, true);
    }
  };

  // Map children array to tab panels
  const childArray = React.Children.toArray(children);

  return (
    <div
      className={cn("w-full flex flex-col", styles?.base, className)}
      data-unit="tabs"
      data-field-id={field.id}
    >
      {/* ── Tab List ─────────────────────────────────────────────── */}
      <div
        role="tablist"
        aria-label={resolveTranslation(field.label, i18nNamespace) ?? "Tabs"}
        className={cn(
          "flex items-end gap-1 border-b border-border px-1",
          "overflow-x-auto scrollbar-none",
          styles?.label
        )}
      >
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTabId;
          return (
            <button
              key={tab.id}
              role="tab"
              id={`${instanceId}-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`${instanceId}-panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              disabled={tab.disabled}
              onClick={() => !tab.disabled && handleSelect(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={cn(
                "relative flex items-center gap-1.5 px-4 py-2.5 text-[var(--text-sm)] font-medium",
                "whitespace-nowrap transition-colors duration-150 focus:outline-none",
                "focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 rounded-t-md",
                isActive
                  ? "text-primary border-b-2 border-primary -mb-px"
                  : "text-foreground/50 hover:text-foreground/80 border-b-2 border-transparent",
                tab.disabled && "opacity-40 cursor-not-allowed"
              )}
            >
              {tab.icon && (
                <span
                  className={cn("text-base", tab.icon)}
                  aria-hidden="true"
                />
              )}
              <span>{tab.label}</span>
              {typeof tab.badge === "number" && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none bg-primary/10 text-primary">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab Panels ───────────────────────────────────────────── */}
      <div className={cn("relative mt-4", styles?.content)}>
        <AnimatePresence mode="wait" initial={false}>
          {tabs.map((tab, index) => {
            if (tab.id !== activeTabId) return null;
            return (
              <m.div
                key={tab.id}
                role="tabpanel"
                id={`${instanceId}-panel-${tab.id}`}
                aria-labelledby={`${instanceId}-tab-${tab.id}`}
                tabIndex={0}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="w-full focus:outline-none"
              >
                {childArray[index] ?? null}
              </m.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

TabsField.displayName = "TabsField";

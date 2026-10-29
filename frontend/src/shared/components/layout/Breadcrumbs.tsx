import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Button,
  Menu,
  MenuItem,
  MenuTrigger,
  Popover,
} from "react-aria-components";
import { ChevronDown, ChevronRight, Home, MoreHorizontal } from "lucide-react";

import { prefetchManager } from "@core/router/helpers/prefetch";
import { usePlatformNavigation } from "@core/router/hooks/usePlatformNavigation";
import type {
  BreadcrumbDropdownItem,
  BreadcrumbItem,
} from "@core/router/types/breadcrumb.types";
import { Zenith } from "@shared/theme";

export interface BreadcrumbsProps {
  /** Array of breadcrumb segments */
  items: BreadcrumbItem[];
  /** Whether data is currently loading */
  loading?: boolean;
  /** Custom separator icon or element */
  separator?: React.ReactNode;
  /** Whether to show home icon for the first root item if path is '/' */
  showHomeIcon?: boolean;
  /** Max visible items before collapsing middle into ellipsis */
  maxItems?: number;
  /** Additional CSS class */
  className?: string;
}

/**
 * SiblingDropdownMenu
 *
 * Interactive dropdown menu allowing instant hopping across sibling routes
 */
const SiblingDropdownMenu: React.FC<{
  label: React.ReactNode;
  items: BreadcrumbDropdownItem[];
  icon?: React.ReactNode;
  active?: boolean;
}> = ({ label, items, icon, active }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { goTo, isActive: checkActive } = usePlatformNavigation();

  return (
    <MenuTrigger onOpenChange={setIsOpen}>
      <Button
        className={Zenith.cn(
          "inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold transition-all duration-200 outline-none",
          "hover:bg-primary/10 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/40",
          active
            ? "text-foreground font-black cursor-default"
            : "text-muted-foreground hover:text-foreground",
          isOpen && "bg-primary/10 text-primary"
        )}
      >
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <span>{label}</span>
        <ChevronDown
          size={12}
          className={Zenith.cn(
            "transition-transform duration-200 opacity-60",
            isOpen && "rotate-180 opacity-100 text-primary"
          )}
        />
      </Button>

      <Popover
        className={Zenith.cn(
          Zenith.glass("prominent"),
          "min-w-[200px] rounded-xl shadow-premium p-1.5 animate-in fade-in zoom-in-95 duration-150 origin-top outline-none z-50"
        )}
        offset={6}
      >
        <Menu className="outline-none">
          {items.map((subItem, idx) => {
            const isSubActive = subItem.href
              ? checkActive(subItem.href, true)
              : subItem.active;

            return (
              <MenuItem
                key={subItem.id || idx}
                id={subItem.id || String(idx)}
                onAction={() => {
                  subItem.onClick?.();
                  if (subItem.href) goTo(subItem.href);
                }}
                onMouseEnter={() => {
                  if (subItem.href) {
                    prefetchManager.prefetch(subItem.href);
                  }
                }}
                className={Zenith.cn(
                  "flex items-center justify-between gap-3 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer outline-none transition-all",
                  "hover:bg-primary/10 data-[focused]:bg-primary/10 text-foreground group",
                  isSubActive && "bg-primary/10 text-primary font-bold"
                )}
              >
                <div className="flex items-center gap-2">
                  {subItem.icon && (
                    <span className="text-muted-foreground group-hover:text-primary transition-colors">
                      {subItem.icon}
                    </span>
                  )}
                  <span>{subItem.label}</span>
                </div>
                {subItem.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-primary/10 text-primary">
                    {subItem.badge}
                  </span>
                )}
              </MenuItem>
            );
          })}
        </Menu>
      </Popover>
    </MenuTrigger>
  );
};

/**
 * OverflowMenu
 *
 * Collapses intermediate breadcrumb segments when list length exceeds maxItems
 */
const OverflowMenu: React.FC<{ items: BreadcrumbItem[] }> = ({ items }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { goTo } = usePlatformNavigation();

  return (
    <MenuTrigger onOpenChange={setIsOpen}>
      <Button
        className={Zenith.cn(
          "p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors outline-none",
          isOpen && "bg-muted text-foreground"
        )}
        aria-label="Show intermediate path segments"
      >
        <MoreHorizontal size={14} />
      </Button>

      <Popover
        className={Zenith.cn(
          Zenith.glass("prominent"),
          "min-w-[180px] rounded-xl shadow-premium p-1.5 animate-in fade-in zoom-in-95 duration-150 origin-top outline-none z-50"
        )}
        offset={6}
      >
        <Menu className="outline-none">
          {items.map((item, idx) => (
            <MenuItem
              key={item.id || idx}
              id={item.id || String(idx)}
              onAction={() => {
                item.onClick?.();
                if (item.path) goTo(item.path);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer outline-none hover:bg-primary/10 text-foreground transition-all"
            >
              {item.icon && (
                <span className="text-muted-foreground">{item.icon}</span>
              )}
              <span>{item.label}</span>
            </MenuItem>
          ))}
        </Menu>
      </Popover>
    </MenuTrigger>
  );
};

/**
 * Breadcrumbs
 *
 * Enterprise Breadcrumb navigation with sibling route switching,
 * hover prefetching, and ARIA 1.2 compliance.
 */
export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  loading = false,
  separator = <ChevronRight size={13} className="text-muted-foreground/40 shrink-0" />,
  showHomeIcon = true,
  maxItems = 4,
  className,
}) => {
  if (loading) {
    return <div className="h-4 w-32 bg-muted/40 animate-pulse rounded" aria-label="Loading breadcrumbs" />;
  }
  if (!items || items.length === 0) return null;

  // Collapse intermediate items if trail is long
  const shouldCollapse = items.length > maxItems;
  const collapsedItems = shouldCollapse ? items.slice(1, items.length - 1) : [];

  return (
    <nav
      aria-label="Breadcrumbs"
      className={Zenith.cn("flex items-center text-xs font-medium text-muted-foreground", className)}
    >
      <ol className="flex items-center gap-1.5 flex-wrap list-none p-0 m-0">
        {shouldCollapse ? (
          <>
            {/* First Segment */}
            <li className="inline-flex items-center gap-1.5">
              <BreadcrumbSegmentNode
                item={items[0]}
                isFirst
                showHomeIcon={showHomeIcon}
              />
            </li>
            <li className="inline-flex items-center" aria-hidden="true">
              {separator}
            </li>

            {/* Collapsed Ellipsis Menu */}
            <li className="inline-flex items-center">
              <OverflowMenu items={collapsedItems} />
            </li>
            <li className="inline-flex items-center" aria-hidden="true">
              {separator}
            </li>

            {/* Last Segment */}
            <li className="inline-flex items-center gap-1.5">
              <BreadcrumbSegmentNode
                item={items[items.length - 1]}
                isLast
                showHomeIcon={false}
              />
            </li>
          </>
        ) : (
          items.map((item, index) => {
            const isLast = index === items.length - 1;
            const isFirst = index === 0;

            return (
              <React.Fragment key={item.id || index}>
                <li className="inline-flex items-center gap-1.5">
                  <BreadcrumbSegmentNode
                    item={item}
                    isFirst={isFirst}
                    isLast={isLast}
                    showHomeIcon={showHomeIcon}
                  />
                </li>
                {!isLast && (
                  <li className="inline-flex items-center" aria-hidden="true">
                    {separator}
                  </li>
                )}
              </React.Fragment>
            );
          })
        )}
      </ol>
    </nav>
  );
};

const BreadcrumbSegmentNode: React.FC<{
  item: BreadcrumbItem;
  isFirst?: boolean;
  isLast?: boolean;
  showHomeIcon?: boolean;
}> = ({ item, isFirst, isLast, showHomeIcon }) => {
  const isHome = isFirst && showHomeIcon && (item.path === "/" || item.label === "Home");

  // 1. Sibling Dropdown Menu Mode
  if (item.items && item.items.length > 0) {
    return (
      <SiblingDropdownMenu
        label={item.label}
        items={item.items}
        icon={item.icon || (isHome ? <Home size={13} /> : undefined)}
        active={item.active ?? isLast}
      />
    );
  }

  // 2. Active Leaf / Last Segment
  if (item.active || isLast || !item.path) {
    return (
      <div
        className="inline-flex items-center gap-1.5 font-bold text-foreground cursor-default"
        aria-current="page"
      >
        {item.icon && <span className="text-muted-foreground">{item.icon}</span>}
        {isHome && <Home size={13} className="text-muted-foreground" />}
        <span>{item.label}</span>
        {item.badge && (
          <span className="px-1.5 py-0.5 text-[10px] font-black rounded-full bg-primary/10 text-primary">
            {item.badge}
          </span>
        )}
      </div>
    );
  }

  // 3. Clickable Link Node
  return (
    <Link
      to={item.path}
      onClick={item.onClick}
      onMouseEnter={() => {
        if (item.path) prefetchManager.prefetch(item.path);
      }}
      className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors px-1 py-0.5 rounded-md hover:bg-muted/30 outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      {item.icon && <span className="text-muted-foreground">{item.icon}</span>}
      {isHome && <Home size={13} />}
      <span>{item.label}</span>
      {item.badge && (
        <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-muted text-muted-foreground">
          {item.badge}
        </span>
      )}
    </Link>
  );
};

export default Breadcrumbs;

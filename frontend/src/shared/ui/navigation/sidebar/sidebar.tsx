import React, { type ElementType, useRef } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useLocation } from "react-router-dom";

import { AppPaths } from "@shell/paths";
import clsx from "clsx";
import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import {
  Box,
  ChevronDown,
  ChevronRight,
  Cpu,
  LayoutDashboard,
  Sliders,
  User,
} from "lucide-react";

import "./sidebar.css";
import { useSidebarStore } from "./sidebarStore";

// Interface mirroring the Safemed NavItem structure
export interface NavItem {
  id: string;
  label: string;
  href?: string;
  icon?: ElementType;
  children?: NavItem[];
  ns?: string;
}

// --- SidebarSkeleton ---
const SidebarSkeleton = () => (
  <div className="sidebar-skeleton">
    <div className="sidebar-skeleton__icon" />
    <div className="sidebar-skeleton__text" />
  </div>
);

// --- SidebarNavItem ---
type SidebarIcon = React.ElementType;

interface SidebarNavItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: SidebarIcon;
  label: string;
  isActive?: boolean;
  level?: number;
  rightSection?: React.ReactNode;
  as?: ElementType;
  to?: any;
}

export const SidebarNavItem = ({
  icon: Icon,
  label,
  isActive = false,
  level = 0,
  rightSection,
  className,
  as: Component = "button",
  ...props
}: SidebarNavItemProps) => {
  const { isOpen } = useSidebarStore();

  const classes = clsx(
    "sidebar-nav-item",
    isActive ? "sidebar-nav-item--active" : "sidebar-nav-item--inactive",
    `sidebar-nav-item--level-${Math.min(level, 3)}`,
    !isOpen && "sidebar-nav-item--collapsed",
    className
  );

  return (
    <Component
      className={classes}
      aria-label={!isOpen ? label : undefined}
      title={!isOpen ? label : undefined} // Clean HTML fallback tooltip
      {...(Component === "button" && !props.type ? { type: "button" } : {})}
      {...props}
    >
      <span className="flex items-center gap-3 min-w-0 flex-1">
        {Icon && (
          <Icon
            size={18}
            className={clsx(
              "sidebar-nav-item__icon",
              isActive && "sidebar-nav-item__icon--active"
            )}
          />
        )}

        {isOpen && <span className="sidebar-nav-item__text">{label}</span>}
      </span>

      {isOpen && rightSection && (
        <span className="sidebar-nav-item__chevron">{rightSection}</span>
      )}
    </Component>
  );
};

// --- SidebarMenuItem ---
interface SidebarMenuItemProps {
  item: NavItem;
  isActive: boolean;
  level?: number;
}

export const SidebarMenuItem = React.memo(
  ({ item, isActive, level = 0 }: SidebarMenuItemProps) => {
    return (
      <SidebarNavItem
        as={NavLink}
        to={item.href ?? "#"}
        icon={item.icon}
        label={item.label}
        isActive={isActive}
        level={level}
      />
    );
  }
);

// --- SidebarMenuGroup ---
interface SidebarMenuGroupProps {
  item: NavItem;
  level?: number;
  isParentActive: (item: NavItem) => boolean;
  isItemActive: (item: NavItem) => boolean;
  active?: boolean;
}

export const SidebarMenuGroup = React.memo(
  ({
    item,
    isParentActive,
    isItemActive,
    level = 0,
    active,
  }: SidebarMenuGroupProps) => {
    const groupRef = useRef<HTMLDivElement>(null);
    const { isOpen, expandedGroups, toggleGroup } = useSidebarStore();

    const open = !!expandedGroups[item.id];
    const parentActive = active !== undefined ? active : isParentActive(item);

    return (
      <div className="sidebar-menu-group" ref={groupRef}>
        <SidebarNavItem
          onClick={() => toggleGroup(item.id)}
          icon={item.icon}
          label={item.label}
          isActive={false}
          level={level}
          className={clsx(parentActive && "sidebar-nav-item--parent-active")}
          rightSection={
            open ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          }
        />

        {isOpen && item.children && (
          <AnimatePresence initial={false}>
            {open && (
              <m.div
                key={`group-content-${item.id}`}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{
                  duration: 0.25,
                  ease: [0.04, 0.62, 0.23, 0.98],
                }}
                className="sidebar-menu-group__children overflow-hidden"
              >
                <div className="space-y-1">
                  {item.children.map((child) =>
                    child.children?.length ? (
                      <SidebarMenuGroup
                        key={child.id}
                        item={child}
                        isParentActive={isParentActive}
                        isItemActive={isItemActive}
                        level={level + 1}
                        active={isParentActive(child)}
                      />
                    ) : (
                      <SidebarMenuItem
                        key={child.id}
                        item={child}
                        isActive={isItemActive(child)}
                        level={level + 1}
                      />
                    )
                  )}
                </div>
              </m.div>
            )}
          </AnimatePresence>
        )}
      </div>
    );
  }
);

// --- SidebarMenu ---
interface SidebarMenuProps {
  items: NavItem[];
  isItemActive: (item: NavItem) => boolean;
  isParentActive: (item: NavItem) => boolean;
}

export const SidebarMenu = ({
  items,
  isItemActive,
  isParentActive,
}: SidebarMenuProps) => {
  const renderedItems = React.useMemo(() => {
    return items.map((item) =>
      item.children?.length ? (
        <SidebarMenuGroup
          key={item.id}
          item={item}
          isParentActive={isParentActive}
          isItemActive={isItemActive}
          level={0}
          active={isParentActive(item)}
        />
      ) : (
        <SidebarMenuItem
          key={item.id}
          item={item}
          isActive={isItemActive(item)}
          level={0}
        />
      )
    );
  }, [items, isItemActive, isParentActive]);

  return <div className="sidebar-menu">{renderedItems}</div>;
};

// --- SidebarBrand ---
interface SidebarBrandProps {
  logoSrc?: string;
  logoAlt?: string;
  brandText?: string;
  href?: string;
  children?: React.ReactNode;
}

export const SidebarBrand = ({
  logoSrc = "/assets/img/logo.png",
  logoAlt = "ZenOS Cloud",
  brandText,
  href = "#",
  children,
}: SidebarBrandProps) => {
  const { isOpen } = useSidebarStore();

  return (
    <div className="sidebar-brand">
      <a href={href} className="brand-link">
        {children ? (
          children
        ) : (
          <>
            <img src={logoSrc} alt={logoAlt} className="brand-image" />
            {isOpen && brandText && (
              <span className="brand-text">{brandText}</span>
            )}
          </>
        )}
      </a>
    </div>
  );
};

// --- SidebarHeader ---
export const SidebarHeader = () => {
  const { isOpen, collapseAll } = useSidebarStore();
  const { t } = useTranslation("layouts/navigation");
  const menuLabel = t("menu.toggle");

  return (
    <div className="sidebar__header">
      <div
        className={clsx(
          "sidebar__header-content",
          isOpen
            ? "sidebar__header-content--expanded"
            : "sidebar__header-content--collapsed"
        )}
      >
        {isOpen ? (
          <m.button
            key="menu-button"
            type="button"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 w-full hover:bg-white/20 transition-colors border-none cursor-pointer"
            onClick={collapseAll}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white"
            >
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
            <span className="sidebar__title">{menuLabel}</span>
          </m.button>
        ) : (
          <button
            type="button"
            className="sidebar__logo"
            onClick={collapseAll}
            aria-label={menuLabel}
            title={menuLabel}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white"
            >
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

// --- SidebarContent ---
export const SidebarContent = ({ children }: { children: React.ReactNode }) => {
  const { isLoading } = useSidebarStore();

  return (
    <div className="sidebar__content">
      <nav className="sidebar__nav">
        {isLoading ? (
          <div className="space-y-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <SidebarSkeleton key={i} />
            ))}
          </div>
        ) : (
          children
        )}
      </nav>
    </div>
  );
};

// --- SidebarBody ---
type SidebarBodyProps = React.HTMLAttributes<HTMLDivElement>;

export const SidebarBody = ({
  className,
  children,
  ...props
}: SidebarBodyProps) => {
  return (
    <div className={clsx("sidebar__body", className)} {...props}>
      {children}
    </div>
  );
};

// --- SidebarFooter ---
export const SidebarFooter = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return <div className={clsx("sidebar__footer", className)}>{children}</div>;
};

// --- Sidebar (Root) ---
interface SidebarProps {
  children: React.ReactNode;
  className?: string;
}

const SidebarRoot = ({ children, className }: SidebarProps) => {
  const { isOpen } = useSidebarStore();

  return (
    <LazyMotion features={domAnimation} strict>
      <m.aside
        initial={false}
        animate={{
          width: isOpen ? 240 : 64,
        }}
        transition={{ type: "spring", stiffness: 120, damping: 18 }}
        className={clsx(
          "sidebar",
          !isOpen && "sidebar--collapsed-inline",
          className
        )}
      >
        {children}
      </m.aside>
    </LazyMotion>
  );
};

// --- RenderMainSection ---
export const RenderMainSection = () => {
  const location = useLocation();
  const { t } = useTranslation("layouts/navigation");

  const isItemActive = (item: NavItem) => {
    if (!item.href) return false;
    if (item.href === "/" || item.href === AppPaths.Root) {
      return location.pathname === "/" || location.pathname === AppPaths.Root;
    }
    return (
      location.pathname === item.href ||
      location.pathname.startsWith(item.href + "/")
    );
  };

  const isParentActive = (item: NavItem) => {
    if (!item.children) return false;
    return item.children.some((child) => isItemActive(child));
  };

  const mainItems: NavItem[] = [
    {
      id: "workspace",
      label: t("sidebar.workspace"),
      href: AppPaths.Workspace,
      icon: LayoutDashboard,
    },
    {
      id: "products-group",
      label: t("sidebar.productsCatalog"),
      icon: Box,
      children: [
        {
          id: "products-list",
          label: t("sidebar.allProducts"),
          href: AppPaths.Products.List,
        },
        {
          id: "products-analytics",
          label: t("sidebar.analytics"),
          href: AppPaths.Products.Analytics,
        },
        {
          id: "products-inventory",
          label: t("sidebar.inventory"),
          href: AppPaths.Products.Inventory,
        },
      ],
    },
  ];

  return (
    <SidebarMenu
      items={mainItems}
      isItemActive={isItemActive}
      isParentActive={isParentActive}
    />
  );
};

// --- RenderSystemSection ---
export const RenderSystemSection = () => {
  const location = useLocation();
  const { t } = useTranslation("layouts/navigation");

  const isItemActive = (item: NavItem) => {
    if (!item.href) return false;
    if (item.href === "/" || item.href === AppPaths.Root) {
      return location.pathname === "/" || location.pathname === AppPaths.Root;
    }
    return (
      location.pathname === item.href ||
      location.pathname.startsWith(item.href + "/")
    );
  };

  const isParentActive = (item: NavItem) => {
    if (!item.children) return false;
    return item.children.some((child) => isItemActive(child));
  };

  const systemItems: NavItem[] = [
    {
      id: "builder",
      label: t("sidebar.formBuilder"),
      href: AppPaths.Builder,
      icon: Cpu,
    },
    {
      id: "account-group",
      label: t("sidebar.identityAccounts"),
      icon: User,
      children: [
        {
          id: "account-profile",
          label: t("sidebar.userProfile"),
          href: AppPaths.Account.Profile,
        },
        {
          id: "account-settings",
          label: t("sidebar.securitySettings"),
          href: AppPaths.Account.Settings,
        },
      ],
    },
    {
      id: "showcase-group",
      label: t("sidebar.showcaseTemplates"),
      icon: Sliders,
      children: [
        {
          id: "showcase-auth",
          label: t("sidebar.authPortal"),
          href: AppPaths.Showcase.Auth,
        },
        {
          id: "showcase-employee",
          label: t("sidebar.employeeWizard"),
          href: AppPaths.Showcase.Employee,
        },
        {
          id: "showcase-branch",
          label: t("sidebar.branchConfig"),
          href: AppPaths.Showcase.Branch,
        },
        {
          id: "showcase-wizard",
          label: t("sidebar.multiStepForm"),
          href: AppPaths.Showcase.Wizard,
        },
        {
          id: "showcase-table",
          label: t("sidebar.interactiveTable"),
          href: AppPaths.Showcase.Table,
        },
      ],
    },
  ];

  return (
    <SidebarMenu
      items={systemItems}
      isItemActive={isItemActive}
      isParentActive={isParentActive}
    />
  );
};

// Object.assign to create the Compound Component structure
export const Sidebar = Object.assign(SidebarRoot, {
  Brand: SidebarBrand,
  Body: SidebarBody,
  Content: SidebarContent,
  Footer: SidebarFooter,
  Header: SidebarHeader,
  Menu: SidebarMenu,
  Group: SidebarMenuGroup,
  Item: SidebarMenuItem,
  NavItem: SidebarNavItem,
  MainSection: RenderMainSection,
  SystemSection: RenderSystemSection,
});

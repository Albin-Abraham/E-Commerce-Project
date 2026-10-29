import { useState } from "react";
import {
  Button,
  Menu,
  MenuItem,
  MenuTrigger,
  Popover,
} from "react-aria-components";

import { useMenuKeyboardControl } from "@core/events/hooks/useMenuKeyboardControl";
import { prefetchManager } from "@core/router/helpers/prefetch";
import { usePlatformNavigation } from "@core/router/hooks/usePlatformNavigation";
import { ChevronDown } from "lucide-react";
import { Loader2 } from "lucide-react";

import { Zenith } from "@shared/theme";

interface NavDropdownProps {
  label: string;
  items: {
    label: string;
    description?: string;
    href?: string;
    onClick?: () => void;
    icon?: React.ReactNode;
  }[];
}

/**
 * NavDropdown
 *
 * Industrial-grade accessible dropdown menu powered by React Aria.
 * Implements Zenith Glassmorphism and strict focus management.
 */
export const NavDropdown: React.FC<NavDropdownProps> = ({ label, items }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const {
    goTo,
    isActive: checkActive,
    state: navState,
  } = usePlatformNavigation();

  // 🛡️ Industrial Keyboard Orchestration (Boilerplate-Free)
  useMenuKeyboardControl({
    isOpen,
    itemCount: items.length,
    scope: "nav-dropdown",
    onSelect: (delta) =>
      setSelectedIndex((prev) => (prev + delta + items.length) % items.length),
    onExecute: () => {
      if (selectedIndex >= 0) {
        const item = items[selectedIndex];
        item.onClick?.();
        if (item.href) goTo(item.href);
        setIsOpen(false);
      }
    },
  });

  return (
    <MenuTrigger onOpenChange={setIsOpen}>
      <Button
        className={Zenith.cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300",
          "hover:bg-primary/10 hover:text-primary outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
          "text-sm font-medium opacity-80 hover:opacity-100",
          isOpen && "bg-primary/10 text-primary opacity-100"
        )}
      >
        {label}
        <ChevronDown
          className={Zenith.cn(
            "w-4 h-4 transition-transform duration-300",
            isOpen && "rotate-180"
          )}
        />
      </Button>

      <Popover
        className={Zenith.cn(
          Zenith.glass("prominent"),
          "min-w-[240px] rounded-2xl shadow-premium p-2 animate-in fade-in zoom-in-95 duration-200 origin-top outline-none"
        )}
        offset={8}
      >
        <Menu
          className="outline-none"
          selectionMode="single"
          selectedKeys={selectedIndex >= 0 ? [selectedIndex.toString()] : []}
        >
          {items.map((item, idx) => {
            const isActive = checkActive(item.href || "", true);
            const isPending = navState.isNavigatingTo === item.href;

            return (
              <MenuItem
                key={idx}
                id={idx.toString()}
                onAction={() => item.onClick?.()}
                onMouseEnter={() => {
                  if (item.href) {
                    prefetchManager.prefetch(item.href);
                  }
                }}
                href={item.href}
                className={Zenith.cn(
                  "flex items-start gap-3 p-3 rounded-xl cursor-pointer outline-none transition-all duration-200",
                  "hover:bg-primary/10 data-[focused]:bg-primary/10 group",
                  selectedIndex === idx &&
                    "bg-primary/10 text-primary border-l-4 border-primary pl-2",
                  isActive && "bg-primary/5 text-primary"
                )}
              >
                <div className="relative">
                  <div
                    className={Zenith.cn(
                      "mt-1 p-1.5 bg-muted rounded-lg transition-colors",
                      "group-hover:bg-primary/20 group-hover:text-primary",
                      (selectedIndex === idx || isActive) &&
                        "bg-primary/20 text-primary"
                    )}
                  >
                    {item.icon}
                  </div>
                  {isPending && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg animate-in fade-in duration-300">
                      <Loader2 className="w-3 h-3 animate-spin text-primary" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span
                      className={Zenith.cn(
                        "text-sm font-bold text-foreground transition-colors",
                        "group-hover:text-primary",
                        (selectedIndex === idx || isActive) && "text-primary"
                      )}
                    >
                      {item.label}
                    </span>
                    {isActive && (
                      <div className="w-1 h-1 rounded-full bg-primary" />
                    )}
                  </div>
                  {item.description && (
                    <span className="text-xs text-muted-foreground line-clamp-1">
                      {item.description}
                    </span>
                  )}
                </div>
              </MenuItem>
            );
          })}
        </Menu>
      </Popover>
    </MenuTrigger>
  );
};

export default NavDropdown;

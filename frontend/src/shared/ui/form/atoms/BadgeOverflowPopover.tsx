import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, m } from "framer-motion";
import { X } from "lucide-react";

import type { FieldOption } from "@ui/form/fields";
import { getI18nString } from "@ui/form/utils/field-utils";
import { cn } from "@ui/form/utils/form-styles";

export interface BadgeOverflowPopoverProps {
  count: number;
  overflowOptions: FieldOption[];
  onRemove: (val: string | number) => void;
  badgeClass?: string;
  tagClass?: string;
  removeButtonClass?: string;
  disabled?: boolean;
}

/**
 * BadgeOverflowPopover
 *
 * Interactive popover replacing the crude native OS `title="..."` tooltip.
 * Displays hidden/overflow items as actual styled chips inside a sleek
 * Zenith surface with dismiss capability.
 */
export const BadgeOverflowPopover: React.FC<BadgeOverflowPopoverProps> = ({
  count,
  overflowOptions,
  onRemove,
  badgeClass,
  tagClass,
  removeButtonClass,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  const triggerRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const margin = 6;
    const popoverWidth = 260;

    let left = rect.left + rect.width / 2 - popoverWidth / 2;
    // Keep within screen edges
    left = Math.max(8, Math.min(left, window.innerWidth - popoverWidth - 8));

    const spaceBelow = window.innerHeight - rect.bottom - margin;
    const top =
      spaceBelow < 180 && rect.top > 180
        ? rect.top - 180 - margin // flip upward if tight
        : rect.bottom + margin;

    setCoords({ top, left });
  }, []);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      updatePosition();
      setIsOpen(true);
    }, 150);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    updatePosition();
    setIsOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen, updatePosition]);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  if (count <= 0 || overflowOptions.length === 0) return null;

  return (
    <>
      <span
        ref={triggerRef}
        data-unit="selected-overflow-badge"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(
          badgeClass,
          "cursor-pointer select-none transition-transform hover:scale-105 active:scale-95"
        )}
      >
        +{count}
      </span>

      {isOpen &&
        createPortal(
          <AnimatePresence>
            <m.div
              ref={popoverRef}
              initial={{ opacity: 0, y: 4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              onMouseEnter={() => {
                if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
              }}
              onMouseLeave={handleMouseLeave}
              style={{
                position: "fixed",
                top: coords.top,
                left: coords.left,
                zIndex: 99999,
                width: 260,
              }}
              className={cn(
                "bg-surface/95 text-foreground backdrop-blur-md border border-border rounded-xl shadow-2xl p-2.5 flex flex-col gap-1.5",
                "animate-in fade-in zoom-in-95 duration-150"
              )}
            >
              <div className="flex items-center justify-between gap-2 px-0.5 pb-1 border-b border-border/50 text-[10px] font-bold text-foreground/60 uppercase tracking-wider">
                <span>Remaining ({overflowOptions.length})</span>
                {!disabled && (
                  <span className="text-[10px] lowercase font-normal opacity-70">
                    click × to remove
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto p-0.5 custom-scrollbar">
                {overflowOptions.map((opt) => {
                  const label = getI18nString(opt.label);
                  return (
                    <span
                      key={String(opt.value)}
                      data-unit="overflow-popover-tag"
                      className={cn(
                        tagClass ||
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-primary/10 text-primary border border-primary/25 dark:bg-primary/20 dark:text-primary dark:border-primary/35"
                      )}
                    >
                      <span className="max-w-[120px] truncate">{label}</span>
                      {!disabled && (
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemove(opt.value);
                          }}
                          className={cn(
                            removeButtonClass ||
                              "hover:bg-foreground/10 rounded-full p-0.5 transition-colors cursor-pointer opacity-70 hover:opacity-100"
                          )}
                          aria-label={`Remove ${label}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  );
                })}
              </div>
            </m.div>
          </AnimatePresence>,
          document.body
        )}
    </>
  );
};

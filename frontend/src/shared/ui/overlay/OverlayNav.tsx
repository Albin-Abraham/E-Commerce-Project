import React, { useEffect, useRef, useState } from "react";

import { Flex } from "@ui/layout/Flex";
import { AlertCircle, Check, ChevronRight } from "lucide-react";

import { Zenith } from "@shared/theme";

export type OverlayNavStatus = "idle" | "current" | "complete" | "error";

export interface OverlayNavItem {
  id: string;
  label: React.ReactNode;
  status?: OverlayNavStatus;
}

export interface OverlayNavProps {
  items: OverlayNavItem[];
  activeId?: string;
  onNavigate?: (id: string) => void;
  className?: string;
}

function resolveStatus(
  item: OverlayNavItem,
  isActive: boolean,
  visited: Set<string>
): OverlayNavStatus {
  if (item.status === "error") return "error";
  if (isActive) return "current";
  if (item.status) return item.status;
  if (visited.has(item.id)) return "complete";
  return "idle";
}

export function OverlayNav({
  items,
  activeId: activeIdProp,
  onNavigate,
  className,
}: OverlayNavProps) {
  const [activeId, setActiveId] = useState(activeIdProp ?? items[0]?.id);
  const [visited, setVisited] = useState(
    () => new Set([items[0]?.id].filter(Boolean) as string[])
  );
  const lockRef = useRef(false);

  useEffect(() => {
    if (activeIdProp) setActiveId(activeIdProp);
  }, [activeIdProp]);

  useEffect(() => {
    if (activeId) {
      setVisited((prev) => {
        if (prev.has(activeId)) return prev;
        const next = new Set(prev);
        next.add(activeId);
        return next;
      });
    }
  }, [activeId]);

  useEffect(() => {
    if (activeIdProp || items.length === 0) return;
    const root = document.querySelector("[data-overlay-body]");
    if (!root) return;

    let ticking = false;
    const onScroll = () => {
      if (lockRef.current || ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const marker = root.getBoundingClientRect().top + 56;
        let current = items[0]?.id;
        for (const item of items) {
          const el = root.querySelector(`[data-field-id="${item.id}"]`);
          if (!el) continue;
          if (el.getBoundingClientRect().top <= marker) current = item.id;
        }
        if (current) {
          setActiveId((prev) => (prev === current ? prev : current));
        }
      });
    };

    root.addEventListener("scroll", onScroll, { passive: true });
    return () => root.removeEventListener("scroll", onScroll);
  }, [items, activeIdProp]);

  if (items.length < 2) return null;

  const currentIndex = Math.max(
    0,
    items.findIndex((item) => item.id === activeId)
  );
  const progress = ((currentIndex + 1) / items.length) * 100;

  return (
    <div
      data-overlay-nav
      className={Zenith.cn(
        "shrink-0 px-6 pt-2.5 pb-2 border-b border-black/[0.05] bg-white",
        className
      )}
    >
      <Flex align="center" gap="xs" className="overflow-x-auto">
        {items.map((item, index) => {
          const isActive = item.id === activeId;
          const status = resolveStatus(item, isActive, visited);
          return (
            <button
              key={item.id}
              type="button"
              title={`Go to ${typeof item.label === "string" ? item.label : "section"}`}
              onClick={() => {
                lockRef.current = true;
                setActiveId(item.id);
                onNavigate?.(item.id);
                window.setTimeout(() => {
                  lockRef.current = false;
                }, 700);
              }}
              className={Zenith.cn(
                "shrink-0 inline-flex items-center gap-1.5 rounded-lg px-2 py-1",
                "text-[0.6875rem] font-semibold tracking-wide cursor-pointer",
                "transition-all duration-150",
                status === "current" &&
                  "text-[var(--module-primary,var(--color-primary))] bg-[var(--module-primary,var(--color-primary))]/5",
                status === "error" && "text-danger bg-danger/5",
                status === "complete" && "text-slate-600 hover:bg-slate-50",
                status === "idle" &&
                  "text-slate-400 hover:bg-slate-50 hover:text-slate-700"
              )}
              aria-current={isActive ? "step" : undefined}
            >
              <span
                className={Zenith.cn(
                  "inline-flex h-5 w-5 items-center justify-center rounded-full text-[0.625rem] font-bold border",
                  status === "current" &&
                    "border-[var(--module-primary,var(--color-primary))] text-[var(--module-primary,var(--color-primary))] bg-[var(--module-primary,var(--color-primary))]/10",
                  status === "error" &&
                    "border-danger text-danger bg-danger/10",
                  status === "complete" &&
                    "border-slate-300 text-slate-500 bg-slate-50",
                  status === "idle" &&
                    "border-transparent text-slate-400 bg-slate-100"
                )}
              >
                {status === "error" ? (
                  <AlertCircle size={11} strokeWidth={2.5} />
                ) : status === "complete" ? (
                  <Check size={11} strokeWidth={2.75} />
                ) : (
                  index + 1
                )}
              </span>
              {item.label}
              <ChevronRight
                size={12}
                className={Zenith.cn(
                  "opacity-50",
                  status === "current"
                    ? "text-[var(--module-primary,var(--color-primary))]"
                    : "text-slate-300"
                )}
              />
            </button>
          );
        })}
      </Flex>
      <div
        className="mt-2 h-0.5 w-full overflow-hidden rounded-full bg-slate-100"
        aria-hidden
      >
        <div
          className="h-full rounded-full bg-[var(--module-primary,var(--color-primary))] transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

import React, {
  useCallback,
  useEffect,
  useId,
  useRef,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";

import { AnimatePresence, type PanInfo, motion } from "framer-motion";

import { type ToastEntry, type ToastVariant, toastBus } from "./toast-bus";

function useIsDarkMode(): boolean {
  const [isDark, setIsDark] = React.useState(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      setIsDark(root.classList.contains("dark"));
    });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

function variantClasses(variant: ToastVariant, isDark: boolean): string {
  const shared =
    "flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg text-sm leading-relaxed min-w-[280px] max-w-[420px] pointer-events-auto select-none";
  switch (variant) {
    case "success":
      return `${shared} bg-success text-white`;
    case "danger":
      return `${shared} bg-danger text-white`;
    case "warning":
      return `${shared} bg-warning ${isDark ? "text-white" : "text-black"}`;
    case "loading":
      return `${shared} bg-neutral-500 text-white`;
    case "info":
    default:
      return `${shared} bg-info text-white`;
  }
}

function variantIcon(variant: ToastVariant): React.ReactNode {
  if (variant === "loading") {
    return (
      <span className="shrink-0 size-5 rounded-full border-2 border-white/30 border-t-white animate-[spin_0.6s_linear_infinite]" />
    );
  }
  const iconShared =
    "shrink-0 size-5 rounded-full flex items-center justify-center text-xs font-bold bg-white/20";
  switch (variant) {
    case "success":
      return <span className={iconShared}>&#x2713;</span>;
    case "danger":
      return <span className={iconShared}>&#x2717;</span>;
    case "warning":
      return <span className={iconShared}>&#x26A0;</span>;
    case "info":
    default:
      return <span className={iconShared}>i</span>;
  }
}

function ariaRole(variant: ToastVariant): {
  role: "alert" | "status";
  "aria-live": "assertive" | "polite";
} {
  if (variant === "danger") {
    return { role: "alert", "aria-live": "assertive" };
  }
  return { role: "status", "aria-live": "polite" };
}

interface ToastItemProps {
  entry: ToastEntry;
  onDismiss: (id: string) => void;
  isDark: boolean;
  idPrefix: string;
}

const SWIPE_THRESHOLD = 80;

const ToastItem: React.FC<ToastItemProps> = ({
  entry,
  onDismiss,
  isDark,
  idPrefix,
}) => {
  const titleId = `${idPrefix}-title`;
  const descId = `${idPrefix}-desc`;

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      if (Math.abs(info.offset.x) > SWIPE_THRESHOLD) {
        onDismiss(entry.id);
      }
    },
    [entry.id, onDismiss]
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.5}
      onDragEnd={handleDragEnd}
      className={variantClasses(entry.variant, isDark)}
      {...ariaRole(entry.variant)}
      aria-labelledby={titleId}
      aria-describedby={entry.description ? descId : undefined}
    >
      {variantIcon(entry.variant)}
      <div className="flex-1">
        <div id={titleId} className="font-semibold">
          {entry.title}
        </div>
        {entry.description && (
          <div id={descId} className="opacity-90 mt-0.5">
            {entry.description}
          </div>
        )}
      </div>
      <button
        onClick={() => onDismiss(entry.id)}
        className="shrink-0 bg-transparent border-none text-inherit cursor-pointer p-1 text-base leading-none opacity-70 hover:opacity-100"
        aria-label="Dismiss"
      >
        &times;
      </button>
    </motion.div>
  );
};

function getTimeout(entry: ToastEntry): number {
  return entry.timeout ?? (entry.variant === "danger" ? 6000 : 4000);
}

export interface ToastContainerProps {
  zIndex?: number;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  zIndex = 9999,
}) => {
  const entries = useSyncExternalStore(
    toastBus.subscribe,
    toastBus.getSnapshot
  );
  const isDark = useIsDarkMode();
  const baseId = useId();

  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );
  const seenRef = useRef<Set<string>>(new Set());

  const handleDismiss = useCallback((id: string) => {
    const t = timersRef.current.get(id);
    if (t !== undefined) {
      clearTimeout(t);
      timersRef.current.delete(id);
    }
    seenRef.current.delete(id);
    toastBus.dismiss(id);
  }, []);

  useEffect(() => {
    for (const entry of entries) {
      if (seenRef.current.has(entry.id)) continue;
      seenRef.current.add(entry.id);

      const timeout = getTimeout(entry);
      if (!Number.isFinite(timeout)) continue;

      const timer = setTimeout(() => handleDismiss(entry.id), timeout);
      timersRef.current.set(entry.id, timer);
    }

    const currentIds = new Set(entries.map((e) => e.id));
    for (const id of timersRef.current.keys()) {
      if (!currentIds.has(id)) {
        const t = timersRef.current.get(id);
        if (t !== undefined) clearTimeout(t);
        timersRef.current.delete(id);
        seenRef.current.delete(id);
      }
    }
  }, [entries, handleDismiss]);

  useEffect(() => {
    return () => {
      for (const t of timersRef.current.values()) clearTimeout(t);
      timersRef.current.clear();
      seenRef.current.clear();
    };
  }, []);

  if (typeof document === "undefined" || entries.length === 0) return null;

  return createPortal(
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 flex flex-col-reverse gap-2 pointer-events-none`}
      style={{ zIndex }}
    >
      <AnimatePresence mode="popLayout">
        {entries.map((entry) => (
          <ToastItem
            key={entry.id}
            entry={entry}
            onDismiss={handleDismiss}
            isDark={isDark}
            idPrefix={`${baseId}-${entry.id}`}
          />
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
};

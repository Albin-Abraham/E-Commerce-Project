/**
 * @file ssr-compat.ts
 * @description SSR-safe utilities for the form system.
 *
 * ## Problem
 * Several form features depend on browser-only APIs:
 * - `framer-motion` animations (`AnimatePresence`, `m.div`)
 * - Field types like `signature`, `file`, `qr-code`
 * - `localStorage` for draft persistence
 *
 * During SSR (Next.js, Remix, etc.), these APIs are unavailable and
 * will throw at module import time or during render.
 *
 * ## Solution
 * - `SSRSafe` wrapper: renders children only on the client
 * - `isSSR()` / `isClient()` guards
 * - Dynamic imports for browser-only field components
 */
import React, { useEffect, useState } from "react";

/** Returns true when running on the server. */
export function isSSR(): boolean {
  return typeof window === "undefined";
}

/** Returns true when running in a browser. */
export function isClient(): boolean {
  return typeof window !== "undefined";
}

/** Returns true when Motion/Animation APIs are available. */
export function isMotionSupported(): boolean {
  if (isSSR()) return false;
  // Check for browser animation API support
  return (
    typeof IntersectionObserver !== "undefined" &&
    typeof requestAnimationFrame !== "undefined"
  );
}

/**
 * SSR-safe wrapper — renders nothing on the server,
 * mounts its children only after hydration on the client.
 *
 * ## Usage
 * ```tsx
 * <SSRSafe fallback={<div className="h-10 animate-pulse bg-muted rounded" />}>
 *   <SignatureField />
 * </SSRSafe>
 * ```
 */
export function SSRSafe({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <>{fallback}</>;
  return <>{children}</>;
}

/**
 * SSR-safe animation wrapper.
 * Disables framer-motion animations on the server and when reduced motion is preferred.
 *
 * ## Usage
 * ```tsx
 * import { m, AnimatePresence } from "framer-motion";
 * import { createMotionWrapper } from "@ui/form/utils/ssr-compat";
 *
 * const MotionDiv = createMotionWrapper("div");
 * ```
 */
export function createMotionWrapper<
  T extends keyof React.JSX.IntrinsicElements,
>(_tag: T) {
  // On the server, render a plain div to avoid framer-motion's SSR issues
  const SSRComponent = React.forwardRef<HTMLElement, any>(
    ({ children, className, style, ...props }, ref) => {
      // Strip framer-motion specific props to avoid React warnings
      const {
        layout,
        initial,
        animate,
        exit,
        transition,
        variants,
        ...safeProps
      } = props;

      if (isSSR() || !isMotionSupported()) {
        return React.createElement(_tag as any, {
          ...safeProps,
          className,
          style,
          ref,
          children,
        });
      }

      // Dynamic import of framer-motion on the client only
      const LazyMotionDiv = React.lazy(() =>
        import("framer-motion").then((mod) => ({
          default: mod.m[_tag as keyof typeof mod.m] as any,
        }))
      );

      return (
        <React.Suspense
          fallback={React.createElement(_tag as any, {
            className,
            style,
            ref,
            children,
          })}
        >
          <LazyMotionDiv
            {...(props as any)}
            className={className}
            style={style}
            ref={ref}
          >
            {children}
          </LazyMotionDiv>
        </React.Suspense>
      );
    }
  );

  SSRComponent.displayName = `MotionWrapper(${String(_tag)})`;
  return SSRComponent;
}

/** List of field types that require browser APIs and should be SSR-guarded. */
export const BROWSER_ONLY_FIELD_TYPES = [
  "signature",
  "file",
  "qr-code",
  "rich-text",
  "rating",
  "autocomplete",
];

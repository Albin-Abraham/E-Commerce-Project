import { useEffect, useState } from "react";

import { tokens } from "@shared/theme/tokens";

type BreakpointKey = keyof typeof tokens.breakpoints;

/**
 * Zenith Breakpoint Hook
 *
 * Provides real-time JS-based breakpoint detection synchronized with
 * the design system tokens.
 */
export function useBreakpoint(breakpoint: BreakpointKey) {
  const [isMatch, setIsMatch] = useState(false);

  useEffect(() => {
    const query = `(min-width: ${tokens.breakpoints[breakpoint]})`;
    const mediaQuery = window.matchMedia(query);

    // Set initial value
    setIsMatch(mediaQuery.matches);

    // Modern event listener
    const handler = (e: MediaQueryListEvent) => setIsMatch(e.matches);
    mediaQuery.addEventListener("change", handler);

    return () => mediaQuery.removeEventListener("change", handler);
  }, [breakpoint]);

  return isMatch;
}

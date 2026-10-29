import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Debounce hook for delaying value updates
 *
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState("");
 * const debouncedSearch = useDebounce(searchTerm, 500);
 *
 * useEffect(() => {
 *   // API call with debounced value
 *   fetchResults(debouncedSearch);
 * }, [debouncedSearch]);
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttle hook for rate-limiting function calls
 *
 * @example
 * ```tsx
 * const throttledScroll = useThrottle(() => {
 *   console.log("Scrolled");
 * }, 1000);
 *
 * <div onScroll={throttledScroll}>...</div>
 * ```
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 1000
): T {
  const lastRun = useRef(Date.now());

  return ((...args) => {
    const now = Date.now();

    if (now - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = now;
    }
  }) as T;
}

/**
 * Previous value hook
 *
 * @example
 * ```tsx
 * const [count, setCount] = useState(0);
 * const previousCount = usePrevious(count);
 * ```
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

/**
 * Mount status hook
 *
 * @example
 * ```tsx
 * const isMounted = useIsMounted();
 *
 * useEffect(() => {
 *   fetchData().then(data => {
 *     if (isMounted()) {
 *       setData(data);
 *     }
 *   });
 * }, []);
 * ```
 */
export function useIsMounted(): () => boolean {
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return useCallback(() => isMounted.current, []);
}

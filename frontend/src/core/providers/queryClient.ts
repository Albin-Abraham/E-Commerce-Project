import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Stop after 2 attempts
        if (failureCount >= 2) return false;
        // Do not retry 4xx client errors (401, 403, 404, 422)
        const status = error?.status || error?.response?.status;
        if (typeof status === "number" && status >= 400 && status < 500) {
          return false;
        }
        return true;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
    mutations: {
      retry: false, // Never auto-retry mutations to prevent duplicate submissions
    },
  },
});


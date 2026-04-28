import { QueryClient } from '@tanstack/react-query';

import { ApiError } from '@/transport/api';

/**
 * Single QueryClient for the whole app. Defaults are tuned for a feed-style
 * UX: data is considered fresh for a short window so navigating between
 * screens does not re-fetch instantly, and we retry network errors but not
 * 4xx (those are deterministic — retrying will not help).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: (failureCount, error) => {
        if (error instanceof ApiError) {
          if (error.status && error.status >= 400 && error.status < 500) {
            return false;
          }
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

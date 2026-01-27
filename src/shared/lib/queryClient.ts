import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity, // Local data is always fresh
      gcTime: 1000 * 60 * 60 * 24, // 24h cache
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: false, // Local queries don't need retry
    },
    mutations: {
      retry: false,
    },
  },
});

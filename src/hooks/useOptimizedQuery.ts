import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { performanceMonitor } from '@/utils/performanceMonitor';

interface OptimizedQueryOptions<T> {
  queryKey: (string | number)[];
  queryFn: () => Promise<T>;
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  priority?: 'high' | 'normal' | 'low';
  prefetchTrigger?: () => boolean;
  backgroundRefetch?: boolean;
}

export const useOptimizedQuery = <T>({
  queryKey,
  queryFn,
  enabled = true,
  staleTime = 10 * 60 * 1000, // 10 minutes default
  gcTime = 30 * 60 * 1000, // 30 minutes default
  priority = 'normal',
  prefetchTrigger,
  backgroundRefetch = false
}: OptimizedQueryOptions<T>) => {
  const queryClient = useQueryClient();
  
  // Wrap queryFn with performance monitoring
  const wrappedQueryFn = useCallback(async () => {
    const endTimer = performanceMonitor.startTimer(`query-${queryKey.join('-')}`);
    try {
      const result = await queryFn();
      return result;
    } finally {
      endTimer();
    }
  }, [queryFn, queryKey]);
  
  // Background prefetching based on trigger
  useEffect(() => {
    if (prefetchTrigger && prefetchTrigger()) {
      queryClient.prefetchQuery({
        queryKey,
        queryFn: wrappedQueryFn,
        staleTime
      });
    }
  }, [prefetchTrigger, queryClient, queryKey, wrappedQueryFn, staleTime]);
  
  // Optimized query configuration based on priority
  const getQueryConfig = () => {
    switch (priority) {
      case 'high':
        return {
          staleTime: staleTime * 0.5, // Shorter stale time for high priority
          gcTime: gcTime * 2, // Longer garbage collection for high priority
          refetchOnWindowFocus: true,
          refetchOnMount: true
        };
      case 'low':
        return {
          staleTime: staleTime * 2, // Longer stale time for low priority
          gcTime: gcTime * 0.5, // Shorter garbage collection for low priority
          refetchOnWindowFocus: false,
          refetchOnMount: false,
          refetchOnReconnect: false
        };
      default:
        return {
          staleTime,
          gcTime,
          refetchOnWindowFocus: false,
          refetchOnMount: false,
          refetchOnReconnect: true
        };
    }
  };
  
  const query = useQuery({
    queryKey,
    queryFn: wrappedQueryFn,
    enabled,
    ...getQueryConfig()
  });
  
  // Background refetch for non-critical data
  useEffect(() => {
    if (backgroundRefetch && query.isSuccess) {
      const interval = setInterval(() => {
        queryClient.invalidateQueries({ queryKey });
      }, staleTime);
      
      return () => clearInterval(interval);
    }
  }, [backgroundRefetch, query.isSuccess, queryClient, queryKey, staleTime]);
  
  return query;
};

// Hook for batched queries with optimistic updates
export const useBatchedQueries = <T>(
  queries: Array<{
    queryKey: (string | number)[];
    queryFn: () => Promise<T>;
    enabled?: boolean;
  }>
) => {
  const queryClient = useQueryClient();
  
  const results = queries.map(({ queryKey, queryFn, enabled = true }) =>
    useQuery({
      queryKey,
      queryFn,
      enabled,
      staleTime: 5 * 60 * 1000, // 5 minutes for batched queries
      gcTime: 15 * 60 * 1000, // 15 minutes garbage collection
    })
  );
  
  // Optimistic updates helper
  const optimisticUpdate = useCallback((
    queryKey: (string | number)[],
    updater: (oldData: T | undefined) => T
  ) => {
    queryClient.setQueryData(queryKey, updater);
  }, [queryClient]);
  
  return {
    results,
    optimisticUpdate,
    isLoading: results.some(r => r.isLoading),
    isError: results.some(r => r.isError),
    allSuccess: results.every(r => r.isSuccess)
  };
};
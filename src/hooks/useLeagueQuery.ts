import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

import { fetchLeagueData, type CombinedLeagueData } from '@/utils/leagueApi';
import { validateLeagueId, sanitizeInput } from '@/utils/inputValidation';
import { createDemoLeagueData, DEMO_LEAGUE_ID } from '@/utils/demoData';
import { useDemo } from '@/contexts/demo-context';
import { performanceMonitor } from '@/utils/performanceMonitor';
import { CACHE_TTL, QUERY_CONFIG } from '@/utils/constants';

export const useLeagueQuery = (leagueId: string | null) => {
  const { isDemoMode } = useDemo();
  const sanitizedLeagueId = leagueId ? sanitizeInput(leagueId) : null;
  const { isValid } = sanitizedLeagueId ? validateLeagueId(sanitizedLeagueId) : { isValid: false };

  // Handle demo mode
  const isDemo = isDemoMode || sanitizedLeagueId === DEMO_LEAGUE_ID;

  // Optimized query function with performance monitoring
  const optimizedQueryFn = useCallback(() => {
    const endTimer = performanceMonitor.startTimer('league-data-fetch');
    
    if (isDemo) {
      return Promise.resolve(createDemoLeagueData()).finally(() => endTimer());
    }
    if (!sanitizedLeagueId) {
      throw new Error("League ID is not provided.");
    }
    return fetchLeagueData(sanitizedLeagueId).finally(() => endTimer());
  }, [isDemo, sanitizedLeagueId]);

  return useQuery<CombinedLeagueData, Error>({
    queryKey: ['league', sanitizedLeagueId, isDemo ? 'demo' : 'real'],
    queryFn: optimizedQueryFn,
    enabled: isDemo || (!!sanitizedLeagueId && isValid),
    staleTime: isDemo ? Infinity : CACHE_TTL.MEDIUM,
    gcTime: isDemo ? Infinity : CACHE_TTL.LONG + CACHE_TTL.MEDIUM, // 15 minutes
    refetchOnWindowFocus: QUERY_CONFIG.REFETCH_ON_WINDOW_FOCUS,
    refetchOnMount: QUERY_CONFIG.REFETCH_ON_MOUNT,
    refetchOnReconnect: QUERY_CONFIG.REFETCH_ON_RECONNECT,
    retry: isDemo ? false : QUERY_CONFIG.RETRY_COUNT,
  });
};
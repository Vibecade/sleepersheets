import { useQuery } from '@tanstack/react-query';
import { fetchLeagueData, type CombinedLeagueData } from '@/utils/leagueApi';
import { validateLeagueId, sanitizeInput } from '@/utils/inputValidation';
import { createDemoLeagueData, DEMO_LEAGUE_ID } from '@/utils/demoData';
import { useDemo } from '@/contexts/DemoContext';
import { performanceMonitor } from '@/utils/performanceMonitor';
import { useCallback } from 'react';

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
    staleTime: isDemo ? Infinity : 1000 * 60 * 5, // Reduced from 10 to 5 minutes for better performance
    gcTime: isDemo ? Infinity : 1000 * 60 * 15, // Reduced from 30 to 15 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true, // Keep reconnect for better UX
    retry: isDemo ? false : 2, // Increased retry for better reliability
  });
};
import { useQuery } from '@tanstack/react-query';
import { fetchLeagueData, type CombinedLeagueData } from '@/utils/leagueApi';
import { validateLeagueId, sanitizeInput } from '@/utils/inputValidation';
import { createDemoLeagueData, DEMO_LEAGUE_ID } from '@/utils/demoData';
import { useDemo } from '@/contexts/DemoContext';

export const useLeagueQuery = (leagueId: string | null) => {
  const { isDemoMode } = useDemo();
  const sanitizedLeagueId = leagueId ? sanitizeInput(leagueId) : null;
  const { isValid } = sanitizedLeagueId ? validateLeagueId(sanitizedLeagueId) : { isValid: false };

  // Handle demo mode
  const isDemo = isDemoMode || sanitizedLeagueId === DEMO_LEAGUE_ID;

  return useQuery<CombinedLeagueData, Error>({
    queryKey: ['league', sanitizedLeagueId, isDemo ? 'demo' : 'real'],
    queryFn: () => {
      if (isDemo) {
        return Promise.resolve(createDemoLeagueData());
      }
      if (!sanitizedLeagueId) {
        throw new Error("League ID is not provided.");
      }
      return fetchLeagueData(sanitizedLeagueId);
    },
    enabled: isDemo || (!!sanitizedLeagueId && isValid),
    staleTime: isDemo ? Infinity : 1000 * 60 * 10, // Demo data never goes stale
    gcTime: isDemo ? Infinity : 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: isDemo ? false : 1,
  });
};
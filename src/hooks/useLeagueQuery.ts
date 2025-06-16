import { useQuery } from '@tanstack/react-query';
import { fetchLeagueData, type CombinedLeagueData } from '@/utils/leagueApi';
import { validateLeagueId, sanitizeInput } from '@/utils/inputValidation';

export const useLeagueQuery = (leagueId: string | null) => {
  const sanitizedLeagueId = leagueId ? sanitizeInput(leagueId) : null;
  const { isValid } = sanitizedLeagueId ? validateLeagueId(sanitizedLeagueId) : { isValid: false };

  return useQuery<CombinedLeagueData, Error>({
    queryKey: ['league', sanitizedLeagueId],
    queryFn: () => {
      if (!sanitizedLeagueId) {
        throw new Error("League ID is not provided.");
      }
      return fetchLeagueData(sanitizedLeagueId);
    },
    enabled: !!sanitizedLeagueId && isValid,
    staleTime: 1000 * 60 * 10, // 10 minutes - increased from 5
    gcTime: 1000 * 60 * 30, // 30 minutes - increased from 10
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Prevent refetch on mount if data exists
    refetchOnReconnect: false, // Prevent refetch on reconnect
    retry: 1,
  });
};
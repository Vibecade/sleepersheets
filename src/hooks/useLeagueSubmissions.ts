
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { validateLeagueId, validateUsername, sanitizeInput } from '@/utils/inputValidation';
import { fetchLeagueData } from '@/utils/leagueApi';
import { cachedFetch } from '@/utils/apiCache';
import type { SleeperUser, SleeperLeague } from '@/types/sleeper';
import type { CombinedLeagueData } from '@/utils/leagueApi';

interface UseLeagueSubmissionsProps {
  leagueId: string;
  username: string;
  setLeagueData: (data: CombinedLeagueData | null) => void;
  setLeagueId: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useLeagueSubmissions = ({
  leagueId,
  username,
  setLeagueData,
  setLeagueId,
  setLoading,
}: UseLeagueSubmissionsProps) => {
  const { toast } = useToast();

  const handleLeagueSubmit = useCallback(async () => {
    const sanitizedLeagueId = sanitizeInput(leagueId);
    const validation = validateLeagueId(sanitizedLeagueId);
    
    if (!validation.isValid) {
      toast({
        title: "Invalid League ID",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const data = await fetchLeagueData(sanitizedLeagueId);
      setLeagueData(data);
      setLeagueId(data.league.league_id);
      toast({
        title: "Success!",
        description: `Loaded data for ${data.league.name} including transactions and draft data`
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch league data. Please check your League ID.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [leagueId, setLoading, setLeagueData, setLeagueId, toast]);

  const handleUsernameSubmit = useCallback(async () => {
    const sanitizedUsername = sanitizeInput(username);
    const validation = validateUsername(sanitizedUsername);
    
    if (!validation.isValid) {
      toast({
        title: "Invalid Username",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const userData = await cachedFetch(`https://api.sleeper.app/v1/user/${sanitizedUsername}`, {}, 10 * 60 * 1000) as SleeperUser;
      const currentYear = new Date().getFullYear();
      const leagues = await cachedFetch(`https://api.sleeper.app/v1/user/${userData.user_id}/leagues/nfl/${currentYear}`, {}, 5 * 60 * 1000) as SleeperLeague[];
      
      if (leagues.length === 0) {
        toast({
          title: "No Leagues Found",
          description: `No NFL leagues found for this username in ${currentYear}`,
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      const firstLeague = leagues[0];
      const data = await fetchLeagueData(firstLeague.league_id);
      setLeagueData(data);
      setLeagueId(data.league.league_id);
      
      toast({
        title: "Success!",
        description: `Found ${leagues.length} league(s). Loaded: ${data.league.name} (${data.league.season})`
      });

    } catch (error) {
      console.error('Error fetching user leagues:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch leagues for this username. Please check the username is correct.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [username, setLoading, setLeagueData, setLeagueId, toast]);

  return { handleLeagueSubmit, handleUsernameSubmit };
};


import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { validateLeagueId, validateUsername, sanitizeInput } from '@/utils/inputValidation';
import { cachedFetch } from '@/utils/apiCache';
import type { SleeperUser, SleeperLeague } from '@/types/sleeper';
import { useMutation } from '@tanstack/react-query';

interface UseLeagueSubmissionsProps {
  leagueIdFromInput: string;
  usernameFromInput: string;
  setLeagueId: (id: string) => void;
}

const fetchUserLeaguesAndGetFirstId = async (username: string): Promise<string> => {
    const sanitizedUsername = sanitizeInput(username);
    const validation = validateUsername(sanitizedUsername);
    if (!validation.isValid) {
        throw new Error(validation.error);
    }
    const userData = await cachedFetch<SleeperUser>(`https://api.sleeper.app/v1/user/${sanitizedUsername}`, {}, 10 * 60 * 1000);
    const currentYear = new Date().getFullYear();
    const leagues = await cachedFetch<SleeperLeague[]>(`https://api.sleeper.app/v1/user/${userData.user_id}/leagues/nfl/${currentYear}`, {}, 5 * 60 * 1000);
    
    if (leagues.length === 0) {
        throw new Error(`No NFL leagues found for this username in ${currentYear}`);
    }
    return leagues[0].league_id;
};


export const useLeagueSubmissions = ({
  leagueIdFromInput,
  usernameFromInput,
  setLeagueId,
}: UseLeagueSubmissionsProps) => {
  const { toast } = useToast();

  const handleLeagueSubmit = useCallback(async () => {
    const sanitizedLeagueId = sanitizeInput(leagueIdFromInput);
    const validation = validateLeagueId(sanitizedLeagueId);
    
    if (!validation.isValid) {
      toast({
        title: "Invalid League ID",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

    setLeagueId(sanitizedLeagueId);
  }, [leagueIdFromInput, setLeagueId, toast]);

  const { mutate, isLoading: isUsernameLoading } = useMutation({
      mutationFn: fetchUserLeaguesAndGetFirstId,
      onSuccess: (foundLeagueId) => {
          setLeagueId(foundLeagueId);
          toast({
              title: "Success!",
              description: `Found user leagues. Loading first league...`
          });
      },
      onError: (error: Error) => {
          toast({
              title: "Error",
              description: error.message,
              variant: "destructive"
          });
      }
  });

  const handleUsernameSubmit = () => {
      mutate(usernameFromInput);
  };

  return { handleLeagueSubmit, handleUsernameSubmit, isUsernameLoading };
};

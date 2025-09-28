
import { useCallback, useState } from 'react';
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

interface UserLeaguesData {
  user: SleeperUser;
  leagues: SleeperLeague[];
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

const fetchUserLeaguesData = async (username: string): Promise<UserLeaguesData> => {
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
    
    // Sort leagues: active leagues first, then by season (newest first)
    const sortedLeagues = leagues.sort((a, b) => {
        const aActive = a.status === 'in_season' || a.status === 'drafting';
        const bActive = b.status === 'in_season' || b.status === 'drafting';
        
        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;
        
        return parseInt(b.season) - parseInt(a.season);
    });
    
    return { user: userData, leagues: sortedLeagues };
};


export const useLeagueSubmissions = ({
  leagueIdFromInput,
  usernameFromInput,
  setLeagueId,
}: UseLeagueSubmissionsProps) => {
  const { toast } = useToast();
  const [userLeaguesData, setUserLeaguesData] = useState<UserLeaguesData | null>(null);
  const [showLeagueSelection, setShowLeagueSelection] = useState(false);

  const handleLeagueSubmit = useCallback(async (inputLeagueId?: string) => {
    const leagueIdValue = inputLeagueId || leagueIdFromInput;
    const sanitizedLeagueId = sanitizeInput(leagueIdValue);
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

  const { mutateAsync: fetchLeaguesData, isPending: isLeaguesLoading } = useMutation({
      mutationFn: fetchUserLeaguesData,
      onSuccess: (data: UserLeaguesData) => {
          setUserLeaguesData(data);
          setShowLeagueSelection(true);
          toast({
              title: "Success!",
              description: `Found ${data.leagues.length} leagues. Select one to continue.`
          });
      },
      onError: (error: Error) => {
          toast({
              title: "Error",
              description: error.message,
              variant: "destructive"
          });
          setUserLeaguesData(null);
          setShowLeagueSelection(false);
      }
  });

  const { mutateAsync: fetchFirstLeague, isPending: isFirstLeagueLoading } = useMutation({
      mutationFn: fetchUserLeaguesAndGetFirstId,
      onSuccess: (foundLeagueId) => {
          setLeagueId(foundLeagueId);
          toast({
              title: "Success!",
              description: `Loading your most recent league...`
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

  const handleUsernameSubmit = async (inputUsername?: string) => {
      const usernameValue = inputUsername || usernameFromInput;
      await fetchLeaguesData(usernameValue);
  };

  const handleQuickLoadFirstLeague = async (inputUsername?: string) => {
      const usernameValue = inputUsername || usernameFromInput;
      await fetchFirstLeague(usernameValue);
  };

  const handleSelectLeague = (leagueId: string) => {
      setLeagueId(leagueId);
      setShowLeagueSelection(false);
      setUserLeaguesData(null);
  };

  const handleBackToForm = () => {
      setShowLeagueSelection(false);
      setUserLeaguesData(null);
  };

  const handleRefreshLeagues = async (inputUsername?: string) => {
      const usernameValue = inputUsername || usernameFromInput;
      if (usernameValue) {
          await fetchLeaguesData(usernameValue);
      }
  };

  return { 
    handleLeagueSubmit, 
    handleUsernameSubmit,
    handleQuickLoadFirstLeague,
    handleSelectLeague,
    handleBackToForm,
    handleRefreshLeagues,
    isUsernameLoading: isLeaguesLoading || isFirstLeagueLoading,
    userLeaguesData,
    showLeagueSelection
  };
};

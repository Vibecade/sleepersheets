
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

const fetchLeaguesForYears = async (userId: string): Promise<{ leagues: SleeperLeague[]; season: number }> => {
    const currentYear = new Date().getFullYear();
    const yearsToTry = [currentYear, currentYear - 1];
    
    for (const year of yearsToTry) {
        const leagues = await cachedFetch<SleeperLeague[]>(
            `https://api.sleeper.app/v1/user/${userId}/leagues/nfl/${year}`, {}, 5 * 60 * 1000
        );
        if (leagues.length > 0) return { leagues, season: year };
    }
    throw new Error(`No NFL leagues found for ${currentYear} or ${currentYear - 1}`);
};

// Sleeper answers an unknown username with 200 and a JSON `null` body rather
// than a 404, so cachedFetch resolves instead of throwing and the miss only
// surfaces later as a null dereference. Turn it into a real error here.
const fetchSleeperUser = async (username: string): Promise<SleeperUser> => {
    const sanitizedUsername = sanitizeInput(username);
    const validation = validateUsername(sanitizedUsername);
    if (!validation.isValid) {
        throw new Error(validation.error);
    }
    const userData = await cachedFetch<SleeperUser | null>(
        `https://api.sleeper.app/v1/user/${sanitizedUsername}`, {}, 10 * 60 * 1000
    );
    if (!userData?.user_id) {
        throw new Error(`No Sleeper user found with the username "${sanitizedUsername}".`);
    }
    return userData;
};

const fetchUserLeaguesAndGetFirstId = async (username: string): Promise<string> => {
    const userData = await fetchSleeperUser(username);
    const { leagues } = await fetchLeaguesForYears(userData.user_id);
    return leagues[0].league_id;
};

const fetchUserLeaguesData = async (username: string): Promise<UserLeaguesData> => {
    const userData = await fetchSleeperUser(username);
    const { leagues } = await fetchLeaguesForYears(userData.user_id);
    
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
              title: "Couldn't load leagues",
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
              title: "Couldn't load leagues",
              description: error.message,
              variant: "destructive"
          });
      }
  });

  // Each mutation reports failures to the user from its own onError handler,
  // so swallow the rejection here rather than letting it surface as an
  // unhandled promise rejection in the console.
  const handleUsernameSubmit = async (inputUsername?: string) => {
      const usernameValue = inputUsername || usernameFromInput;
      await fetchLeaguesData(usernameValue).catch(() => {
          // Reported by the mutation's onError handler.
      });
  };

  const handleQuickLoadFirstLeague = async (inputUsername?: string) => {
      const usernameValue = inputUsername || usernameFromInput;
      await fetchFirstLeague(usernameValue).catch(() => {
          // Reported by the mutation's onError handler.
      });
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
          await fetchLeaguesData(usernameValue).catch(() => {
              // Reported by the mutation's onError handler.
          });
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

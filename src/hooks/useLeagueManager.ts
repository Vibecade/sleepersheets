
import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useUserLeagues } from '@/hooks/useUserLeagues';
import { useUrlParams } from '@/hooks/useUrlParams';
import { useLeagueOwnershipStatus } from '@/hooks/useLeagueOwnershipStatus';
import { cachedFetch } from '@/utils/apiCache';
import { validateLeagueId, validateUsername, sanitizeInput, rateLimiter } from '@/utils/inputValidation';
import type { SleeperLeague, SleeperUser, SleeperRoster, SleeperDraft, SleeperTransaction, SleeperPlayer } from '@/types/sleeper';

export interface CombinedLeagueData {
  league: SleeperLeague;
  rosters: SleeperRoster[];
  users: SleeperUser[];
  players: Record<string, SleeperPlayer>;
  transactions: SleeperTransaction[];
  drafts: SleeperDraft[];
  draftPicks: { draft: SleeperDraft; picks: any[] }[];
}

export const useLeagueManager = () => {
  const [leagueId, setLeagueId] = useState('');
  const [username, setUsername] = useState('');
  const [leagueData, setLeagueData] = useState<CombinedLeagueData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [cacheMetadata, setCacheMetadata] = useState<{ isCached: boolean; lastFetched?: Date } | null>(null);
  const [ownershipStatus, setOwnershipStatus] = useState<{
    isOwned: boolean;
    ownedByCurrentUser: boolean;
    ownerInfo?: { id: string; claimed_at: string };
  } | null>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { addRecentLeague } = useUserLeagues();
  const { getLeagueFromUrl, setLeagueInUrl, clearUrlParams } = useUrlParams();
  const { checkOwnershipStatus } = useLeagueOwnershipStatus();

  const fetchLeagueData = useCallback(async (targetLeagueId: string, preserveCurrentLeagueId: boolean = false) => {
    console.log('Fetching league data for ID:', targetLeagueId);

    const clientId = 'league_fetch';
    if (!rateLimiter.isAllowed(clientId, 20, 60000)) { 
      throw new Error('Too many requests. Please wait a moment before trying again.');
    }

    try {
      const [league, rosters, users, players] = await Promise.all([
        cachedFetch(`https://api.sleeper.app/v1/league/${targetLeagueId}`, {}, 10 * 60 * 1000) as Promise<SleeperLeague>,
        cachedFetch(`https://api.sleeper.app/v1/league/${targetLeagueId}/rosters`, {}, 5 * 60 * 1000) as Promise<SleeperRoster[]>,
        cachedFetch(`https://api.sleeper.app/v1/league/${targetLeagueId}/users`, {}, 10 * 60 * 1000) as Promise<SleeperUser[]>,
        cachedFetch('https://api.sleeper.app/v1/players/nfl', {}, 60 * 60 * 1000) as Promise<Record<string, SleeperPlayer>>
      ]);

      console.log('League data retrieved:', { 
        name: league.name, 
        season: league.season, 
        league_id: league.league_id 
      });

      const currentWeek = league.settings?.week || 1;
      const [transactions, drafts] = await Promise.all([
        cachedFetch(`https://api.sleeper.app/v1/league/${targetLeagueId}/transactions/${currentWeek}`, {}, 2 * 60 * 1000) as Promise<SleeperTransaction[]>,
        cachedFetch(`https://api.sleeper.app/v1/league/${targetLeagueId}/drafts`, {}, 10 * 60 * 1000) as Promise<SleeperDraft[]>
      ]);
      
      const draftPicks = [];
      if (drafts.length > 0) {
        const draftPickPromises = drafts.map(async (draft) => {
          const picks = await cachedFetch(`https://api.sleeper.app/v1/draft/${draft.draft_id}/picks`, {}, 10 * 60 * 1000);
          return { draft, picks };
        });
        
        const results = await Promise.all(draftPickPromises);
        draftPicks.push(...results.filter(Boolean));
      }

      const combinedData: CombinedLeagueData = {
        league,
        rosters,
        users,
        players,
        transactions,
        drafts,
        draftPicks
      };

      setLeagueData(combinedData);
      
      if (!preserveCurrentLeagueId) {
        setLeagueId(targetLeagueId);
      }
      
      return league;

    } catch (error) {
      console.error('Error fetching league data:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    if (leagueData?.league?.league_id) {
      checkOwnershipStatus(leagueData.league.league_id).then(setOwnershipStatus);
    } else {
      setOwnershipStatus(null);
    }
  }, [leagueData?.league?.league_id, checkOwnershipStatus]);

  useEffect(() => {
    const urlLeagueId = getLeagueFromUrl();
    if (urlLeagueId && !leagueData) {
      setLeagueId(urlLeagueId);
      const loadUrlLeague = async () => {
        const sanitizedLeagueId = sanitizeInput(urlLeagueId);
        const validation = validateLeagueId(sanitizedLeagueId);
        
        if (validation.isValid) {
          setLoading(true);
          try {
            await fetchLeagueData(sanitizedLeagueId);
          } catch (error) {
            console.error('Error loading league from URL:', error);
          } finally {
            setLoading(false);
          }
        }
      };
      loadUrlLeague();
    }
  }, [getLeagueFromUrl, leagueData, fetchLeagueData]);

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
      const league = await fetchLeagueData(sanitizedLeagueId);
      toast({
        title: "Success!",
        description: `Loaded data for ${league.name} including transactions and draft data`
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
  }, [leagueId, fetchLeagueData, toast]);

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
    console.log('Fetching user data for username:', sanitizedUsername);

    try {
      const userData = await cachedFetch(`https://api.sleeper.app/v1/user/${sanitizedUsername}`, {}, 10 * 60 * 1000) as SleeperUser;
      console.log('User data retrieved:', userData);
      
      const currentYear = new Date().getFullYear();
      console.log('Fetching leagues for year:', currentYear);
      const leagues = await cachedFetch(`https://api.sleeper.app/v1/user/${userData.user_id}/leagues/nfl/${currentYear}`, {}, 5 * 60 * 1000) as SleeperLeague[];
      console.log('Leagues found:', leagues.length, leagues.map(l => ({ name: l.name, season: l.season, league_id: l.league_id })));
      
      if (leagues.length === 0) {
        toast({
          title: "No Leagues Found",
          description: `No NFL leagues found for this username in ${currentYear}`,
          variant: "destructive"
        });
        return;
      }

      const firstLeague = leagues[0];
      setLeagueId(firstLeague.league_id);
      
      const league = await fetchLeagueData(firstLeague.league_id);
      
      toast({
        title: "Success!",
        description: `Found ${leagues.length} league(s). Loaded: ${league.name} (${league.season})`
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
  }, [username, fetchLeagueData, toast]);

  const handleRefreshData = useCallback(async () => {
    if (!leagueData?.league?.league_id) return;
    
    setLoading(true);
    try {
      const league = await fetchLeagueData(leagueData.league.league_id, true);
      toast({
        title: "Success!",
        description: `Refreshed data for ${league.name}`
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to refresh league data.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [leagueData?.league?.league_id, fetchLeagueData, toast]);

  const handleSelectLeague = useCallback((selectedLeagueId: string) => {
    setLeagueId(selectedLeagueId);
    setLeagueInUrl(selectedLeagueId);
  }, [setLeagueInUrl]);

  const handleBackToLeagues = useCallback(() => {
    setLeagueData(null);
    setLeagueId('');
    setOwnershipStatus(null);
    clearUrlParams();
  }, [clearUrlParams]);

  const handleOwnershipChanged = useCallback(async () => {
    if (leagueData?.league?.league_id) {
      const newStatus = await checkOwnershipStatus(leagueData.league.league_id);
      setOwnershipStatus(newStatus);
    }
  }, [leagueData?.league?.league_id, checkOwnershipStatus]);
  
  return {
    leagueId,
    setLeagueId,
    username,
    setUsername,
    leagueData,
    loading,
    loadingProgress,
    loadingMessage,
    cacheMetadata,
    ownershipStatus,
    handleLeagueSubmit,
    handleUsernameSubmit,
    handleRefreshData,
    handleSelectLeague,
    handleBackToLeagues,
    handleOwnershipChanged,
  };
};

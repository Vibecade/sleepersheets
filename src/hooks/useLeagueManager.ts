import { useState, useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useUrlParams } from '@/hooks/useUrlParams';
import { useLeagueOwnershipStatus } from '@/hooks/useLeagueOwnershipStatus';
import { useLeagueSubmissions } from './useLeagueSubmissions';
import { useUrlLeagueLoader } from './useUrlLeagueLoader';
import { useLeagueQuery } from './useLeagueQuery';
import { useQueryClient } from '@tanstack/react-query';
import { useUserLeagues } from './useUserLeagues';

export const useLeagueManager = () => {
  const [activeLeagueId, setActiveLeagueId] = useState('');
  const [leagueIdInput, setLeagueIdInput] = useState('');
  const [username, setUsername] = useState('');
  
  const { data: leagueData, isLoading, error, refetch } = useLeagueQuery(activeLeagueId);
  const { addRecentLeague, recentLeagues } = useUserLeagues();
  const lastTrackedLeagueIdRef = useRef<string | null>(null);

  const [ownershipStatus, setOwnershipStatus] = useState<{
    isOwned: boolean;
    ownedByCurrentUser: boolean;
    ownerInfo?: { id: string; claimed_at: string };
  } | null>(null);
  
  const { toast } = useToast();
  const { setLeagueInUrl, clearUrlParams } = useUrlParams();
  const { checkOwnershipStatus } = useLeagueOwnershipStatus();
  const queryClient = useQueryClient();

  useUrlLeagueLoader({
    leagueIdFromState: activeLeagueId,
    setLeagueId: (id) => {
      setLeagueIdInput(id);
      setActiveLeagueId(id);
    },
  });

  const { 
    handleLeagueSubmit: originalHandleLeagueSubmit, 
    handleUsernameSubmit: originalHandleUsernameSubmit,
    handleQuickLoadFirstLeague,
    handleSelectLeague: handleSelectLeagueFromUsername,
    handleBackToForm,
    handleRefreshLeagues,
    isUsernameLoading,
    userLeaguesData,
    showLeagueSelection
  } = useLeagueSubmissions({
    leagueIdFromInput: leagueIdInput,
    usernameFromInput: username,
    setLeagueId: setActiveLeagueId,
  });

  // Wrap submission handlers with scroll-to-top
  const handleLeagueSubmit = useCallback(async (leagueId?: string) => {
    await originalHandleLeagueSubmit(leagueId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [originalHandleLeagueSubmit]);

  const handleUsernameSubmit = useCallback(async (username?: string) => {
    await originalHandleUsernameSubmit(username);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [originalHandleUsernameSubmit]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  }, [error, toast]);

  const checkAndSetOwnership = useCallback(async (leagueId: string) => {
    if (!leagueId) return;
    const status = await checkOwnershipStatus(leagueId);
    setOwnershipStatus(status);
  }, [checkOwnershipStatus]);

  // Only check ownership when league ID changes
  useEffect(() => {
    if (leagueData?.league?.league_id) {
      const currentLeagueId = leagueData.league.league_id;
      checkAndSetOwnership(currentLeagueId);
      
      // Avoid repeated localStorage writes for the same league during refreshes.
      if (lastTrackedLeagueIdRef.current !== currentLeagueId) {
        addRecentLeague({
          leagueId: currentLeagueId,
          name: leagueData.league.name,
          season: leagueData.league.season,
          totalRosters: leagueData.league.total_rosters
        });
        lastTrackedLeagueIdRef.current = currentLeagueId;
      }
      
      // Only update URL if it's different to prevent navigation spam
      const currentLeagueInUrl = new URLSearchParams(window.location.search).get('league');
      if (currentLeagueInUrl !== currentLeagueId) {
        setLeagueInUrl(currentLeagueId);
      }
    } else {
      setOwnershipStatus(null);
      lastTrackedLeagueIdRef.current = null;
    }
  }, [leagueData?.league?.league_id, checkAndSetOwnership, setLeagueInUrl, addRecentLeague, leagueData?.league?.name, leagueData?.league?.season, leagueData?.league?.total_rosters]);

  const handleRefreshData = useCallback(async () => {
    if (!activeLeagueId) return;
    
    try {
      await refetch();
      toast({
        title: "Success!",
        description: `Refreshed data for ${leagueData?.league.name}`
      });
    } catch (err) {
      // error is already handled by the useEffect
    }
  }, [activeLeagueId, refetch, toast, leagueData?.league.name]);

  const handleResyncLeagueData = useCallback(async () => {
    if (!activeLeagueId) return;
    
    try {
      // Import apiCache to clear targeted cache entries
      const { apiCache } = await import('@/utils/apiCache');
      
      // Clear all league-specific cache except players (to avoid rate limits)
      apiCache.clearLeagueDataExceptPlayers(activeLeagueId);
      
      // Force a fresh fetch
      await refetch();
      
      toast({
        title: "Success!",
        description: `Re-synced league data (excluding players to avoid rate limits)`
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to re-sync league data. Please try again.",
        variant: "destructive"
      });
    }
  }, [activeLeagueId, refetch, toast]);

  const handleSelectLeague = useCallback((selectedLeagueId: string) => {
    setLeagueIdInput(selectedLeagueId);
    setActiveLeagueId(selectedLeagueId);
    
    // Only update URL if it's different to prevent navigation spam
    const currentLeagueInUrl = new URLSearchParams(window.location.search).get('league');
    if (currentLeagueInUrl !== selectedLeagueId) {
      setLeagueInUrl(selectedLeagueId);
    }
    
    // Scroll to top when switching leagues
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setLeagueInUrl]);

  const handleBackToLeagues = useCallback(() => {
    const previousLeagueId = activeLeagueId;
    setActiveLeagueId('');
    setLeagueIdInput('');
    setUsername('');
    setOwnershipStatus(null);
    clearUrlParams();
    if (previousLeagueId) {
      queryClient.removeQueries({ queryKey: ['league', previousLeagueId] });
    }
  }, [clearUrlParams, queryClient, activeLeagueId]);

  const handleOwnershipChanged = useCallback(async () => {
    if (leagueData?.league?.league_id) {
      const newStatus = await checkOwnershipStatus(leagueData.league.league_id);
      setOwnershipStatus(newStatus);
    }
  }, [leagueData?.league?.league_id, checkOwnershipStatus]);
  
  return {
    leagueId: leagueIdInput,
    setLeagueId: setLeagueIdInput,
    username,
    setUsername,
    leagueData: leagueData || null,
    loading: isLoading || isUsernameLoading,
    ownershipStatus,
    handleLeagueSubmit,
    handleUsernameSubmit,
    handleQuickLoadFirstLeague,
    handleSelectLeagueFromUsername,
    handleBackToForm,
    handleRefreshLeagues,
    handleRefreshData,
    handleResyncLeagueData,
    handleSelectLeague,
    handleBackToLeagues,
    handleOwnershipChanged,
    userLeaguesData,
    showLeagueSelection,
    recentLeagues,
    // Keep these for component compatibility, but they are no longer actively managed
    loadingProgress: 0,
    loadingMessage: '',
    cacheMetadata: null,
  };
};

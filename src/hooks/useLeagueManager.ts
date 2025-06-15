
import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useUrlParams } from '@/hooks/useUrlParams';
import { useLeagueOwnershipStatus } from '@/hooks/useLeagueOwnershipStatus';
import { useLeagueSubmissions } from './useLeagueSubmissions';
import { useUrlLeagueLoader } from './useUrlLeagueLoader';
import { useLeagueQuery } from './useLeagueQuery';
import { useQueryClient } from '@tanstack/react-query';

export const useLeagueManager = () => {
  const [activeLeagueId, setActiveLeagueId] = useState('');
  const [leagueIdInput, setLeagueIdInput] = useState('');
  const [username, setUsername] = useState('');
  
  const { data: leagueData, isLoading, error, refetch } = useLeagueQuery(activeLeagueId);

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

  const { handleLeagueSubmit, handleUsernameSubmit, isUsernameLoading } = useLeagueSubmissions({
    leagueIdFromInput: leagueIdInput,
    usernameFromInput: username,
    setLeagueId: setActiveLeagueId,
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  }, [error, toast]);

  useEffect(() => {
    if (leagueData?.league?.league_id) {
      checkOwnershipStatus(leagueData.league.league_id).then(setOwnershipStatus);
      setLeagueInUrl(leagueData.league.league_id);
    } else {
      setOwnershipStatus(null);
    }
  }, [leagueData?.league?.league_id, checkOwnershipStatus, setLeagueInUrl]);

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

  const handleSelectLeague = useCallback((selectedLeagueId: string) => {
    setLeagueIdInput(selectedLeagueId);
    setActiveLeagueId(selectedLeagueId);
    setLeagueInUrl(selectedLeagueId);
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
    handleRefreshData,
    handleSelectLeague,
    handleBackToLeagues,
    handleOwnershipChanged,
    // Keep these for component compatibility, but they are no longer actively managed
    loadingProgress: 0,
    loadingMessage: '',
    cacheMetadata: null,
  };
};

import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useUrlParams } from '@/hooks/useUrlParams';
import { useLeagueOwnershipStatus } from '@/hooks/useLeagueOwnershipStatus';
import { fetchLeagueData } from '@/utils/leagueApi';
import type { CombinedLeagueData } from '@/utils/leagueApi';
import { useLeagueSubmissions } from './useLeagueSubmissions';
import { useUrlLeagueLoader } from './useUrlLeagueLoader';

export const useLeagueManager = () => {
  const [leagueId, setLeagueId] = useState('');
  const [username, setUsername] = useState('');
  const [leagueData, setLeagueData] = useState<CombinedLeagueData | null>(null);
  const [loading, setLoading] = useState(false);
  const [ownershipStatus, setOwnershipStatus] = useState<{
    isOwned: boolean;
    ownedByCurrentUser: boolean;
    ownerInfo?: { id: string; claimed_at: string };
  } | null>(null);
  
  const { toast } = useToast();
  const { setLeagueInUrl, clearUrlParams } = useUrlParams();
  const { checkOwnershipStatus } = useLeagueOwnershipStatus();

  useUrlLeagueLoader({ leagueData, setLeagueData, setLeagueId, setLoading });

  const { handleLeagueSubmit, handleUsernameSubmit } = useLeagueSubmissions({
    leagueId,
    username,
    setLeagueData,
    setLeagueId,
    setLoading,
  });

  useEffect(() => {
    if (leagueData?.league?.league_id) {
      checkOwnershipStatus(leagueData.league.league_id).then(setOwnershipStatus);
      setLeagueInUrl(leagueData.league.league_id);
    } else {
      setOwnershipStatus(null);
    }
  }, [leagueData?.league?.league_id, checkOwnershipStatus, setLeagueInUrl]);

  const handleRefreshData = useCallback(async () => {
    if (!leagueData?.league?.league_id) return;
    
    setLoading(true);
    try {
      const data = await fetchLeagueData(leagueData.league.league_id);
      setLeagueData(data);
      toast({
        title: "Success!",
        description: `Refreshed data for ${data.league.name}`
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
  }, [leagueData?.league?.league_id, toast]);

  const handleSelectLeague = useCallback((selectedLeagueId: string) => {
    setLeagueId(selectedLeagueId);
    setLeagueInUrl(selectedLeagueId);
  }, [setLeagueInUrl]);

  const handleBackToLeagues = useCallback(() => {
    setLeagueData(null);
    setLeagueId('');
    setUsername('');
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

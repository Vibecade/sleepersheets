import React, { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import LeagueData from '@/components/LeagueData';
import Footer from '@/components/Footer';
import EnhancedErrorBoundary from '@/components/EnhancedErrorBoundary';
import LeagueHeader from '@/components/home/LeagueHeader';
import LeagueConnectionForm from '@/components/home/LeagueConnectionForm';
import PageHead from '@/components/PageHead';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import OfflineIndicator from '@/components/OfflineIndicator';
import UserDashboard from '@/components/dashboard/UserDashboard';
import LeagueShareDialog from '@/components/league/LeagueShareDialog';
import OwnershipTransferDialog from '@/components/league/OwnershipTransferDialog';
import { ProgressIndicator } from '@/components/ui/progress-indicator';
import { CacheIndicator } from '@/components/ui/cache-indicator';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cachedFetch } from '@/utils/apiCache';
import { enhancedApiCache } from '@/utils/enhancedApiCache';
import { useUserLeagues } from '@/hooks/useUserLeagues';
import { useAuth } from '@/contexts/AuthContext';
import { useUrlParams } from '@/hooks/useUrlParams';
import { useLeagueOwnershipStatus } from '@/hooks/useLeagueOwnershipStatus';
import { validateLeagueId, validateUsername, sanitizeInput, rateLimiter } from '@/utils/inputValidation';
import type { SleeperLeague, SleeperUser, SleeperRoster, SleeperDraft, SleeperTransaction, SleeperPlayer } from '@/types/sleeper';

const Index = React.memo(() => {
  const [leagueId, setLeagueId] = useState('');
  const [username, setUsername] = useState('');
  const [leagueData, setLeagueData] = useState(null);
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

  // Check ownership status when league data loads
  useEffect(() => {
    if (leagueData?.league?.league_id) {
      checkOwnershipStatus(leagueData.league.league_id).then(setOwnershipStatus);
    } else {
      setOwnershipStatus(null);
    }
  }, [leagueData?.league?.league_id, checkOwnershipStatus]);

  // Handle URL parameters on mount
  useEffect(() => {
    const urlLeagueId = getLeagueFromUrl();
    if (urlLeagueId && !leagueData) {
      setLeagueId(urlLeagueId);
      // Auto-load the league from URL
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
  }, [getLeagueFromUrl, leagueData]);

  const fetchLeagueData = useCallback(async (targetLeagueId: string, preserveCurrentLeagueId: boolean = false) => {
    console.log('Fetching league data for ID:', targetLeagueId);

    // Rate limiting check
    const clientId = 'league_fetch';
    if (!rateLimiter.isAllowed(clientId, 20, 60000)) { // 20 requests per minute
      throw new Error('Too many requests. Please wait a moment before trying again.');
    }

    try {
      // Use cached fetch with different TTLs for different data types
      const [league, rosters, users, players] = await Promise.all([
        cachedFetch(`https://api.sleeper.app/v1/league/${targetLeagueId}`, {}, 10 * 60 * 1000) as Promise<SleeperLeague>, // 10 min - league data changes rarely
        cachedFetch(`https://api.sleeper.app/v1/league/${targetLeagueId}/rosters`, {}, 5 * 60 * 1000) as Promise<SleeperRoster[]>, // 5 min - rosters change occasionally
        cachedFetch(`https://api.sleeper.app/v1/league/${targetLeagueId}/users`, {}, 10 * 60 * 1000) as Promise<SleeperUser[]>, // 10 min - users change rarely
        cachedFetch('https://api.sleeper.app/v1/players/nfl', {}, 60 * 60 * 1000) as Promise<Record<string, SleeperPlayer>> // 1 hour - player data changes daily
      ]);

      console.log('League data retrieved:', { 
        name: league.name, 
        season: league.season, 
        league_id: league.league_id 
      });

      // Fetch additional data with shorter cache for more dynamic content
      const currentWeek = league.settings?.week || 1;
      const [transactions, drafts] = await Promise.all([
        cachedFetch(`https://api.sleeper.app/v1/league/${targetLeagueId}/transactions/${currentWeek}`, {}, 2 * 60 * 1000) as Promise<SleeperTransaction[]>, // 2 min - transactions are dynamic
        cachedFetch(`https://api.sleeper.app/v1/league/${targetLeagueId}/drafts`, {}, 10 * 60 * 1000) as Promise<SleeperDraft[]> // 10 min - drafts change rarely
      ]);
      
      // Fetch draft picks for each draft
      const draftPicks = [];
      if (drafts.length > 0) {
        const draftPickPromises = drafts.map(async (draft) => {
          const picks = await cachedFetch(`https://api.sleeper.app/v1/draft/${draft.draft_id}/picks`, {}, 10 * 60 * 1000); // 10 min
          return { draft, picks };
        });
        
        const results = await Promise.all(draftPickPromises);
        draftPicks.push(...results.filter(Boolean));
      }

      const combinedData = {
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
    // The useEffect will handle loading the league
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

  return (
    <div className="min-h-screen">
      <PageHead
        title="Fantasy Football Salary Cap Management"
        description="The ultimate salary cap and contract management tool for your fantasy football dynasty league. Track salaries, manage contracts, simulate trades, and export league data."
      />
      
      <LeagueHeader />

      <div className="max-w-6xl mx-auto px-4 py-12">
        <OfflineIndicator />
        <PWAInstallPrompt />
        
        <EnhancedErrorBoundary level="page">
          {!leagueData ? (
            <div className="max-w-4xl mx-auto">
              {user ? (
                <Tabs defaultValue="connect" className="space-y-8">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="connect">Connect League</TabsTrigger>
                    <TabsTrigger value="dashboard">My Dashboard</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="connect" className="space-y-8">
                    <LeagueConnectionForm
                      leagueId={leagueId}
                      setLeagueId={setLeagueId}
                      username={username}
                      setUsername={setUsername}
                      onLeagueSubmit={handleLeagueSubmit}
                      onUsernameSubmit={handleUsernameSubmit}
                      loading={loading}
                    />
                    
                    {loading && (
                      <div className="mt-6">
                        <ProgressIndicator
                          message={loadingMessage || 'Loading...'}
                          progress={loadingProgress}
                          showPercentage={true}
                        />
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="dashboard">
                    <UserDashboard onSelectLeague={handleSelectLeague} />
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="max-w-2xl mx-auto space-y-8">
                  <LeagueConnectionForm
                    leagueId={leagueId}
                    setLeagueId={setLeagueId}
                    username={username}
                    setUsername={setUsername}
                    onLeagueSubmit={handleLeagueSubmit}
                    onUsernameSubmit={handleUsernameSubmit}
                    loading={loading}
                  />
                  
                  {loading && (
                    <div className="mt-6">
                      <ProgressIndicator
                        message={loadingMessage || 'Loading...'}
                        progress={loadingProgress}
                        showPercentage={true}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    onClick={handleBackToLeagues}
                  >
                    ← Back to Leagues
                  </Button>
                  
                  {cacheMetadata && (
                    <CacheIndicator 
                      isCached={cacheMetadata.isCached}
                      lastFetched={cacheMetadata.lastFetched}
                    />
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <LeagueShareDialog
                    leagueId={leagueData.league.league_id}
                    leagueName={leagueData.league.name}
                  />
                  
                  {/* Only show transfer dialog if user owns the league */}
                  {user && ownershipStatus?.ownedByCurrentUser && (
                    <OwnershipTransferDialog
                      leagueId={leagueData.league.league_id}
                      leagueName={leagueData.league.name}
                      onTransferComplete={() => {
                        toast({
                          title: "Ownership Transferred",
                          description: "You no longer own this league"
                        });
                        handleOwnershipChanged();
                      }}
                    />
                  )}
                </div>
              </div>

              <LeagueData 
                data={leagueData} 
                onRefreshData={handleRefreshData}
                onOwnershipChanged={handleOwnershipChanged}
              />
            </div>
          )}
        </EnhancedErrorBoundary>
      </div>

      <Footer />
    </div>
  );
});

Index.displayName = 'Index';

export default Index;

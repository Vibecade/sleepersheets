
import React, { useState, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import LeagueData from '@/components/LeagueData';
import Footer from '@/components/Footer';
import { LeagueHeader } from '@/components/home/LeagueHeader';
import { LeagueConnectCard } from '@/components/home/LeagueConnectCard';

const Index = () => {
  const [leagueId, setLeagueId] = useState('');
  const [username, setUsername] = useState('');
  const [leagueData, setLeagueData] = useState(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchLeagueData = useCallback(async (targetLeagueId: string, preserveCurrentLeagueId: boolean = false) => {
    console.log('Fetching league data for ID:', targetLeagueId);

    try {
      // Use Promise.all for parallel requests where possible
      const [leagueResponse, rostersResponse, usersResponse, playersResponse] = await Promise.all([
        fetch(`https://api.sleeper.app/v1/league/${targetLeagueId}`),
        fetch(`https://api.sleeper.app/v1/league/${targetLeagueId}/rosters`),
        fetch(`https://api.sleeper.app/v1/league/${targetLeagueId}/users`),
        fetch('https://api.sleeper.app/v1/players/nfl')
      ]);

      if (!leagueResponse.ok) {
        throw new Error('League not found');
      }

      const [league, rosters, users, players] = await Promise.all([
        leagueResponse.json(),
        rostersResponse.json(),
        usersResponse.json(),
        playersResponse.json()
      ]);

      console.log('League data retrieved:', { 
        name: league.name, 
        season: league.season, 
        league_id: league.league_id 
      });

      // Fetch additional data in parallel
      const currentWeek = league.settings?.week || 1;
      const [transactionsResponse, draftsResponse] = await Promise.all([
        fetch(`https://api.sleeper.app/v1/league/${targetLeagueId}/transactions/${currentWeek}`),
        fetch(`https://api.sleeper.app/v1/league/${targetLeagueId}/drafts`)
      ]);

      const [transactions, drafts] = await Promise.all([
        transactionsResponse.ok ? transactionsResponse.json() : [],
        draftsResponse.ok ? draftsResponse.json() : []
      ]);
      
      // Fetch draft picks for each draft
      const draftPicks = [];
      if (drafts.length > 0) {
        const draftPickPromises = drafts.map(async (draft) => {
          const picksResponse = await fetch(`https://api.sleeper.app/v1/draft/${draft.draft_id}/picks`);
          if (picksResponse.ok) {
            const picks = await picksResponse.json();
            return { draft, picks };
          }
          return null;
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
    if (!leagueId.trim()) {
      toast({
        title: "League ID Required",
        description: "Please enter a valid Sleeper League ID",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const league = await fetchLeagueData(leagueId);
      toast({
        title: "Success!",
        description: `Loaded data for ${league.name} including transactions and draft data`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch league data. Please check your League ID.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [leagueId, fetchLeagueData, toast]);

  const handleUsernameSubmit = useCallback(async () => {
    if (!username.trim()) {
      toast({
        title: "Username Required",
        description: "Please enter a valid Sleeper username",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    console.log('Fetching user data for username:', username);

    try {
      const userResponse = await fetch(`https://api.sleeper.app/v1/user/${username}`);
      if (!userResponse.ok) {
        throw new Error('User not found');
      }
      const userData = await userResponse.json();
      console.log('User data retrieved:', userData);
      
      const currentYear = new Date().getFullYear();
      console.log('Fetching leagues for year:', currentYear);
      const response = await fetch(`https://api.sleeper.app/v1/user/${userData.user_id}/leagues/nfl/${currentYear}`);
      if (!response.ok) {
        throw new Error('Failed to fetch leagues for user');
      }
      const leagues = await response.json();
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
      toast({
        title: "Error",
        description: "Failed to fetch leagues for this username. Please check the username is correct.",
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
      toast({
        title: "Error",
        description: "Failed to refresh league data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [leagueData?.league?.league_id, fetchLeagueData, toast]);

  // Memoize the league connect card props to prevent unnecessary re-renders
  const connectCardProps = useMemo(() => ({
    leagueId,
    setLeagueId,
    username,
    setUsername,
    onLeagueSubmit: handleLeagueSubmit,
    onUsernameSubmit: handleUsernameSubmit,
    loading
  }), [leagueId, username, handleLeagueSubmit, handleUsernameSubmit, loading]);

  return (
    <div className="min-h-screen">
      <LeagueHeader />

      <div className="max-w-6xl mx-auto px-4 py-12">
        {!leagueData ? (
          <div className="max-w-2xl mx-auto space-y-8">
            <LeagueConnectCard {...connectCardProps} />
          </div>
        ) : (
          <LeagueData 
            data={leagueData} 
            onRefreshData={handleRefreshData}
          />
        )}
      </div>

      <Footer />
    </div>
  );
};

export default React.memo(Index);

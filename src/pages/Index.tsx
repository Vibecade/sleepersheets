
import React, { useState } from 'react';
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

  const fetchLeagueData = async (targetLeagueId: string, preserveCurrentLeagueId: boolean = false) => {
    console.log('Fetching league data for ID:', targetLeagueId);

    try {
      // Fetch league basic info
      const leagueResponse = await fetch(`https://api.sleeper.app/v1/league/${targetLeagueId}`);
      if (!leagueResponse.ok) {
        throw new Error('League not found');
      }
      const league = await leagueResponse.json();
      console.log('League data retrieved:', { 
        name: league.name, 
        season: league.season, 
        league_id: league.league_id 
      });
      
      // Fetch rosters
      const rostersResponse = await fetch(`https://api.sleeper.app/v1/league/${targetLeagueId}/rosters`);
      const rosters = await rostersResponse.json();
      
      // Fetch users
      const usersResponse = await fetch(`https://api.sleeper.app/v1/league/${targetLeagueId}/users`);
      const users = await usersResponse.json();
      
      // Fetch NFL players data
      const playersResponse = await fetch('https://api.sleeper.app/v1/players/nfl');
      const players = await playersResponse.json();

      // Fetch transactions for current week
      const currentWeek = league.settings?.week || 1;
      const transactionsResponse = await fetch(`https://api.sleeper.app/v1/league/${targetLeagueId}/transactions/${currentWeek}`);
      const transactions = transactionsResponse.ok ? await transactionsResponse.json() : [];

      // Fetch draft data
      const draftsResponse = await fetch(`https://api.sleeper.app/v1/league/${targetLeagueId}/drafts`);
      const drafts = draftsResponse.ok ? await draftsResponse.json() : [];
      
      // Fetch draft picks for each draft
      const draftPicks = [];
      for (const draft of drafts) {
        const picksResponse = await fetch(`https://api.sleeper.app/v1/draft/${draft.draft_id}/picks`);
        if (picksResponse.ok) {
          const picks = await picksResponse.json();
          draftPicks.push({
            draft,
            picks
          });
        }
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
      
      // Only update leagueId if we're not preserving the current one (like during refresh)
      if (!preserveCurrentLeagueId) {
        setLeagueId(targetLeagueId);
      }
      
      return league;

    } catch (error) {
      console.error('Error fetching league data:', error);
      throw error;
    }
  };

  const handleLeagueSubmit = async () => {
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
  };

  const handleUsernameSubmit = async () => {
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
      // First, get the user object to retrieve the user_id
      const userResponse = await fetch(`https://api.sleeper.app/v1/user/${username}`);
      if (!userResponse.ok) {
        throw new Error('User not found');
      }
      const userData = await userResponse.json();
      console.log('User data retrieved:', userData);
      
      // Now use the user_id to fetch leagues for current season (2025)
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

      // Use the first league found and automatically load its data
      const firstLeague = leagues[0];
      setLeagueId(firstLeague.league_id);
      
      // Automatically fetch the league data
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
  };

  // Handle refresh data without losing league ID
  const handleRefreshData = async () => {
    if (!leagueData?.league?.league_id) return;
    
    setLoading(true);
    try {
      const league = await fetchLeagueData(leagueData.league.league_id, true); // preserve current league ID
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
  };

  return (
    <div className="min-h-screen">
      <LeagueHeader />

      <div className="max-w-6xl mx-auto px-4 py-12">
        {!leagueData ? (
          <div className="max-w-2xl mx-auto space-y-8">
            <LeagueConnectCard
              leagueId={leagueId}
              setLeagueId={setLeagueId}
              username={username}
              setUsername={setUsername}
              onLeagueSubmit={handleLeagueSubmit}
              onUsernameSubmit={handleUsernameSubmit}
              loading={loading}
            />
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

export default Index;

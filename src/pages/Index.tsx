
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import LeagueData from '@/components/LeagueData';
import { LeagueHeader } from '@/components/home/LeagueHeader';
import { LeagueConnectCard } from '@/components/home/LeagueConnectCard';

const Index = () => {
  const [leagueId, setLeagueId] = useState('');
  const [username, setUsername] = useState('');
  const [leagueData, setLeagueData] = useState(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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
    console.log('Fetching league data for ID:', leagueId);

    try {
      // Fetch league basic info
      const leagueResponse = await fetch(`https://api.sleeper.app/v1/league/${leagueId}`);
      if (!leagueResponse.ok) {
        throw new Error('League not found');
      }
      const league = await leagueResponse.json();
      
      // Fetch rosters
      const rostersResponse = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`);
      const rosters = await rostersResponse.json();
      
      // Fetch users
      const usersResponse = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/users`);
      const users = await usersResponse.json();
      
      // Fetch NFL players data
      const playersResponse = await fetch('https://api.sleeper.app/v1/players/nfl');
      const players = await playersResponse.json();

      // Fetch transactions for current week
      const currentWeek = league.settings?.week || 1;
      const transactionsResponse = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/transactions/${currentWeek}`);
      const transactions = transactionsResponse.ok ? await transactionsResponse.json() : [];

      // Fetch draft data
      const draftsResponse = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/drafts`);
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
      toast({
        title: "Success!",
        description: `Loaded data for ${league.name} including transactions and draft data`
      });

    } catch (error) {
      console.error('Error fetching league data:', error);
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
    console.log('Fetching leagues for username:', username);

    try {
      const response = await fetch(`https://api.sleeper.app/v1/user/${username}/leagues/nfl/2024`);
      if (!response.ok) {
        throw new Error('User not found');
      }
      const leagues = await response.json();
      
      if (leagues.length === 0) {
        toast({
          title: "No Leagues Found",
          description: "No NFL leagues found for this username in 2024",
          variant: "destructive"
        });
        return;
      }

      // For now, use the first league found
      const firstLeague = leagues[0];
      setLeagueId(firstLeague.league_id);
      
      toast({
        title: "Leagues Found",
        description: `Found ${leagues.length} league(s). Using: ${firstLeague.name}`
      });

    } catch (error) {
      console.error('Error fetching user leagues:', error);
      toast({
        title: "Error",
        description: "Failed to fetch leagues for this username",
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
          <LeagueData data={leagueData} />
        )}
      </div>
    </div>
  );
};

export default Index;

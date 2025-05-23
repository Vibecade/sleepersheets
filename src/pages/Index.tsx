
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Download, Users, Trophy, ArrowRight } from 'lucide-react';
import LeagueData from '@/components/LeagueData';

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
      {/* Header */}
      <div className="glass border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl p-3 shadow-lg">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Sleeper Export Utility</h1>
              <p className="text-gray-400">Export your fantasy football league data to CSV</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {!leagueData ? (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* League ID Input */}
            <Card className="fade-in">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Users className="w-5 h-5 text-emerald-400" />
                  <span>Enter League Information</span>
                </CardTitle>
                <CardDescription>
                  Enter your Sleeper League ID or username to get started
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="leagueId" className="text-white">League ID (Direct)</Label>
                    <div className="flex space-x-2 mt-1">
                      <Input
                        id="leagueId"
                        placeholder="e.g., 123456789"
                        value={leagueId}
                        onChange={(e) => setLeagueId(e.target.value)}
                        className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      />
                      <Button 
                        onClick={handleLeagueSubmit} 
                        disabled={loading}
                      >
                        {loading ? 'Loading...' : <ArrowRight className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <Separator className="flex-1 bg-white/20" />
                    <span className="text-sm text-gray-400">or</span>
                    <Separator className="flex-1 bg-white/20" />
                  </div>

                  <div>
                    <Label htmlFor="username" className="text-white">Sleeper Username</Label>
                    <div className="flex space-x-2 mt-1">
                      <Input
                        id="username"
                        placeholder="e.g., your_username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      />
                      <Button 
                        onClick={handleUsernameSubmit} 
                        disabled={loading}
                        variant="outline"
                      >
                        {loading ? 'Loading...' : <ArrowRight className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      We'll find your leagues and use the first one found
                    </p>
                  </div>
                </div>

                <div className="glass border border-blue-400/30 rounded-lg p-4 bg-blue-500/10">
                  <h4 className="font-medium text-blue-300 mb-2">How to find your League ID:</h4>
                  <ol className="text-sm text-blue-200 space-y-1 list-decimal list-inside">
                    <li>Open the Sleeper app or website</li>
                    <li>Go to your league</li>
                    <li>Check the URL - the League ID is the long number in the URL</li>
                    <li>Example: sleeper.app/leagues/<strong>123456789</strong>/team</li>
                  </ol>
                </div>
              </CardContent>
            </Card>

            {/* Features Preview */}
            <Card className="fade-in" style={{ animationDelay: '0.2s' }}>
              <CardHeader>
                <CardTitle className="text-white">What you'll get:</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="glass p-4 rounded-xl text-center group hover:scale-105 transition-all duration-300">
                    <Users className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    <h4 className="font-medium text-white">Full Rosters</h4>
                    <p className="text-sm text-gray-400">Complete team rosters with player details</p>
                  </div>
                  <div className="glass p-4 rounded-xl text-center group hover:scale-105 transition-all duration-300">
                    <Trophy className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                    <h4 className="font-medium text-white">Draft & Transactions</h4>
                    <p className="text-sm text-gray-400">Draft picks and all league transactions</p>
                  </div>
                  <div className="glass p-4 rounded-xl text-center group hover:scale-105 transition-all duration-300">
                    <Download className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                    <h4 className="font-medium text-white">CSV Export</h4>
                    <p className="text-sm text-gray-400">Download data for spreadsheet analysis</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <LeagueData data={leagueData} />
        )}
      </div>
    </div>
  );
};

export default Index;

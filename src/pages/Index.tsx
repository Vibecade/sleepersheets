
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Download, Users, Trophy, ArrowRight, Sparkles, Star, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
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
      {/* Enhanced Header */}
      <div className="glass-header border-b border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-emerald-600/10 animate-pulse"></div>
        <div className="max-w-6xl mx-auto px-4 py-8 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-600 rounded-2xl p-4 shadow-2xl pulse-glow">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold gradient-text mb-2">SleeperSheets</h1>
                <p className="text-gray-300 text-lg">Transform your fantasy football data into actionable insights</p>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant="outline" className="gradient-border">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Advanced Analytics
                  </Badge>
                  <Badge variant="outline" className="gradient-border">
                    <Star className="w-3 h-3 mr-1" />
                    Pro Features
                  </Badge>
                </div>
              </div>
            </div>
            <Link to="/how-to">
              <Button variant="outline" className="flex items-center space-x-2">
                <HelpCircle className="w-4 h-4" />
                <span>How To Use</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {!leagueData ? (
          <div className="max-w-2xl mx-auto space-y-8">
            {/* Enhanced League ID Input */}
            <Card className="fade-in hover-lift gradient-border">
              <CardHeader className="text-center pb-4">
                <CardTitle className="flex items-center justify-center space-x-3 text-white text-2xl">
                  <div className="bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl p-2">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <span>Connect Your League</span>
                </CardTitle>
                <CardDescription className="text-gray-300 text-lg">
                  Enter your Sleeper League ID or username to unlock powerful analytics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-6">
                  <div className="group">
                    <Label htmlFor="leagueId" className="text-white text-sm font-semibold mb-3 block">
                      League ID (Direct Access)
                    </Label>
                    <div className="flex space-x-3">
                      <Input
                        id="leagueId"
                        placeholder="e.g., 123456789"
                        value={leagueId}
                        onChange={(e) => setLeagueId(e.target.value)}
                        className="flex-1 h-12 text-lg group-hover:border-emerald-400/50 transition-all duration-300"
                      />
                      <Button 
                        onClick={handleLeagueSubmit} 
                        disabled={loading}
                        size="lg"
                        className="px-6"
                      >
                        {loading ? (
                          <div className="shimmer w-4 h-4 rounded"></div>
                        ) : (
                          <ArrowRight className="w-5 h-5" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <Separator className="flex-1 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                    <span className="text-sm text-gray-400 font-medium px-4 py-2 glass rounded-full">or</span>
                    <Separator className="flex-1 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                  </div>

                  <div className="group">
                    <Label htmlFor="username" className="text-white text-sm font-semibold mb-3 block">
                      Sleeper Username (Auto-Discovery)
                    </Label>
                    <div className="flex space-x-3">
                      <Input
                        id="username"
                        placeholder="e.g., your_username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="flex-1 h-12 text-lg group-hover:border-blue-400/50 transition-all duration-300"
                      />
                      <Button 
                        onClick={handleUsernameSubmit} 
                        disabled={loading}
                        variant="outline"
                        size="lg"
                        className="px-6"
                      >
                        {loading ? (
                          <div className="shimmer w-4 h-4 rounded"></div>
                        ) : (
                          <ArrowRight className="w-5 h-5" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 italic">
                      We'll automatically find and load your most recent league
                    </p>
                  </div>
                </div>

                <div className="glass border border-blue-400/30 rounded-xl p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover-lift">
                  <h4 className="font-semibold text-blue-300 mb-3 flex items-center">
                    <Star className="w-4 h-4 mr-2" />
                    How to find your League ID:
                  </h4>
                  <ol className="text-sm text-blue-200 space-y-2 list-decimal list-inside leading-relaxed">
                    <li>Open the Sleeper app or website</li>
                    <li>Navigate to your league</li>
                    <li>Look at the URL - the League ID is the long number</li>
                    <li>Example: sleeper.app/leagues/<span className="font-mono bg-blue-600/30 px-2 py-1 rounded">123456789</span>/team</li>
                  </ol>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Features Preview */}
            <Card className="fade-in hover-lift" style={{ animationDelay: '0.2s' }}>
              <CardHeader className="text-center">
                <CardTitle className="text-white text-2xl mb-2">Unlock Premium Features</CardTitle>
                <CardDescription className="text-gray-300">
                  Everything you need for comprehensive league analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="glass p-6 rounded-2xl text-center group hover-lift cursor-pointer gradient-border">
                    <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl p-4 w-16 h-16 mx-auto mb-4 pulse-glow">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="font-semibold text-white text-lg mb-2">Complete Rosters</h4>
                    <p className="text-sm text-gray-400 leading-relaxed">Detailed team compositions with player statistics and performance metrics</p>
                  </div>
                  <div className="glass p-6 rounded-2xl text-center group hover-lift cursor-pointer gradient-border">
                    <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-4 w-16 h-16 mx-auto mb-4 pulse-glow">
                      <Trophy className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="font-semibold text-white text-lg mb-2">Draft Analytics</h4>
                    <p className="text-sm text-gray-400 leading-relaxed">Complete draft history and transaction logs for strategic insights</p>
                  </div>
                  <div className="glass p-6 rounded-2xl text-center group hover-lift cursor-pointer gradient-border">
                    <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl p-4 w-16 h-16 mx-auto mb-4 pulse-glow">
                      <Download className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="font-semibold text-white text-lg mb-2">Export & Analysis</h4>
                    <p className="text-sm text-gray-400 leading-relaxed">Professional CSV exports ready for spreadsheet analysis and reporting</p>
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

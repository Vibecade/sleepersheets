
import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Copy, CheckCircle, Sparkles, FileSpreadsheet, Bot, Download, Loader2, Trophy, Clock } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';
import { useToast } from '@/hooks/use-toast';
import { LeagueDataProvider } from '@/components/LeagueDataProvider';
import ExportActions from '@/components/ExportActions';
import StaticPageLayout from '@/components/layout/StaticPageLayout';
import { useUserLeagues, type RecentLeague } from '@/hooks/useUserLeagues';
import { fetchLeagueData } from '@/utils/leagueApi';
import type {
  SleeperLeagueDataBundle,
  SleeperUser,
  SleeperUserMap,
} from '@/types/sleeper';

interface ExportRouteState {
  leagueData?: SleeperLeagueDataBundle;
}

const buildUserMap = (users: SleeperUser[]) =>
  users.reduce<SleeperUserMap>((acc, user) => {
    acc[user.user_id] = user;
    return acc;
  }, {});

const buildRosterUserMap = (leagueData: SleeperLeagueDataBundle) => {
  const { rosters, users } = leagueData;
  const userMap = buildUserMap(users);

  return rosters.reduce<Record<number, SleeperUser | undefined>>((acc, roster) => {
    acc[roster.roster_id] = userMap[roster.owner_id];
    return acc;
  }, {});
};

const Export = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const routeLeagueData = (location.state as ExportRouteState | null)?.leagueData;
  const { recentLeagues, ownedLeagues } = useUserLeagues();

  // League loaded inline from this page (when user picks one from the empty-state)
  const [inlineLeagueData, setInlineLeagueData] = useState<SleeperLeagueDataBundle | null>(null);
  const [loadingLeagueId, setLoadingLeagueId] = useState<string | null>(null);

  const leagueData = routeLeagueData ?? inlineLeagueData;

  // Merge owned + recent into a single deduped quick-pick list, owned first.
  const quickPickLeagues = useMemo(() => {
    const seen = new Set<string>();
    const list: Array<{
      leagueId: string;
      name: string;
      season?: string;
      totalRosters?: number;
      lastAccessed?: string;
      source: 'owned' | 'recent';
    }> = [];

    ownedLeagues.forEach((entry) => {
      if (!entry.league_id || seen.has(entry.league_id)) return;
      seen.add(entry.league_id);
      list.push({
        leagueId: entry.league_id,
        name: entry.leagueData?.name || `League ${entry.league_id.slice(-6)}`,
        season: entry.leagueData?.season,
        totalRosters: entry.leagueData?.total_rosters,
        lastAccessed: entry.claimed_at,
        source: 'owned',
      });
    });

    recentLeagues.forEach((entry: RecentLeague) => {
      if (!entry.leagueId || seen.has(entry.leagueId)) return;
      seen.add(entry.leagueId);
      list.push({
        leagueId: entry.leagueId,
        name: entry.name,
        season: entry.season,
        totalRosters: entry.totalRosters,
        lastAccessed: entry.lastAccessed,
        source: 'recent',
      });
    });

    return list.slice(0, 6);
  }, [ownedLeagues, recentLeagues]);

  const handleLoadLeague = async (leagueId: string) => {
    if (loadingLeagueId) return;
    setLoadingLeagueId(leagueId);
    try {
      const combined = await fetchLeagueData(leagueId);
      // Pass `draftPicks` through as-is — every export consumer (ExportAll,
      // DraftExport, DataDashboard) expects the nested `{ draft, picks }[]`
      // shape, NOT a flat list of picks. SleeperDraftPick is the per-draft
      // container (see src/types/sleeper.ts:53).
      setInlineLeagueData({
        league: combined.league,
        rosters: combined.rosters,
        users: combined.users,
        players: combined.players,
        transactions: combined.transactions,
        drafts: combined.drafts,
        draftPicks: combined.draftPicks as SleeperLeagueDataBundle['draftPicks'],
      });
      toast({
        title: 'League loaded',
        description: `${combined.league.name} is ready to export.`,
      });
    } catch (error) {
      console.error('Failed to load league for export:', error);
      toast({
        title: 'Could not load league',
        description: error instanceof Error ? error.message : 'Try again in a moment.',
        variant: 'destructive',
      });
    } finally {
      setLoadingLeagueId(null);
    }
  };

  const chatGptPrompt = `I am uploading my Sleeper fantasy football league export files. Please analyze and create a comprehensive Google Sheets document with the following structure:

## EXPORTED FILES INCLUDED:
- **Rosters**: All players with fantasy salaries, contract years, and franchise values
- **Standings**: Team rankings with W/L records, win %, points for/against
- **Matchups**: Weekly game results with scores and margins
- **Transactions**: Full season add/drop/trade history with FAAB bids
- **Draft**: Complete draft history with keeper designations and pick order
- **Settings**: Scoring rules, roster limits, salary cap configuration

## REQUESTED OUTPUT:

### 1. Team Sheets (one per team):
- Player roster with position, NFL team, salary, contract years
- Team total salary at top
- Roster breakdown by position

### 2. Main Summary Sheet:
- All teams ranked by standings
- Total salary per team
- Salary cap space remaining
- Points for/against totals

### 3. Transactions Sheet:
- Full season transaction log
- FAAB spending summary per team
- Trade history with draft picks

### 4. Matchups Sheet:
- Week-by-week results
- Head-to-head records
- Highest/lowest scores

### 5. Draft Sheet:
- Complete draft board
- Keeper list
- Draft position analysis

### 6. League Info Sheet:
- Scoring settings
- Roster requirements
- Playoff format
- Any custom rules from exports

## FORMATTING:
- Bold headers, alternate row shading
- Format salaries as currency
- Calculate salary cap space automatically
- Add conditional formatting for wins/losses
- Create charts for key metrics (salary distribution, standings)

[Attach CSV export files below]
`;


  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(chatGptPrompt);
      toast({
        title: "Copied to clipboard!",
        description: "The ChatGPT prompt has been copied to your clipboard."
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please manually copy the text below.",
        variant: "destructive"
      });
    }
  };

  const ExportContent = () => (
    <StaticPageLayout
      title="Export & Analytics"
      description="Export clean league data and turn it into reports, sheets, and AI-ready analysis."
      eyebrow="Reports"
      icon={Download}
      iconClassName="bg-gradient-to-br from-emerald-500 to-blue-500"
      contentClassName="max-w-6xl"
    >
        <Tabs defaultValue={leagueData ? "export" : "tutorial"} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-auto p-1 mb-8">
            <TabsTrigger value="tutorial" className="text-sm py-3 px-4 min-h-[50px]">
              <Bot className="w-4 h-4 mr-2" />
              AI Tutorial
            </TabsTrigger>
            <TabsTrigger value="export" className="text-sm py-3 px-4 min-h-[50px]">
              <Download className="w-4 h-4 mr-2" />
              Export Center
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export">
            {leagueData ? (
              <LeagueDataProvider data={leagueData}>
                <ExportActions
                  league={leagueData.league}
                  rosters={leagueData.rosters}
                  userMap={buildUserMap(leagueData.users)}
                  rosterUserMap={buildRosterUserMap(leagueData)}
                  players={leagueData.players}
                  transactions={leagueData.transactions || []}
                  draftPicks={leagueData.draftPicks || []}
                />
              </LeagueDataProvider>
            ) : quickPickLeagues.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Pick a league to export</CardTitle>
                  <CardDescription>
                    Choose one of your saved leagues to load it here. We'll pull the data and have it ready to export in a moment.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {quickPickLeagues.map((entry) => {
                      const isLoading = loadingLeagueId === entry.leagueId;
                      return (
                        <button
                          key={entry.leagueId}
                          type="button"
                          onClick={() => handleLoadLeague(entry.leagueId)}
                          disabled={!!loadingLeagueId}
                          className="group flex items-center gap-3 px-4 py-3 bg-card border border-border text-left hover:border-primary/50 transition-colors disabled:opacity-60 disabled:cursor-wait"
                        >
                          <span
                            className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-primary text-primary-foreground"
                            style={{ clipPath: 'polygon(15% 0, 100% 0, 85% 100%, 0 100%)' }}
                          >
                            {isLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trophy className="w-4 h-4" />
                            )}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className="font-headline font-bold uppercase text-foreground truncate"
                                style={{ fontSize: 14, letterSpacing: '0.05em' }}
                                title={entry.name}
                              >
                                {entry.name}
                              </span>
                              {entry.source === 'owned' && (
                                <Badge variant="outline" className="text-[10px] py-0 h-5">
                                  OWNED
                                </Badge>
                              )}
                            </div>
                            <div
                              className="font-mono text-muted-foreground mt-0.5 flex items-center gap-2"
                              style={{ fontSize: 10, letterSpacing: '0.1em' }}
                            >
                              <Clock className="w-3 h-3" />
                              {entry.season ? `S${entry.season}` : ''}
                              {entry.totalRosters ? ` · ${entry.totalRosters} TEAMS` : ''}
                            </div>
                          </div>
                          <span
                            className="font-mono font-bold text-primary group-hover:translate-x-0.5 transition-transform"
                            style={{ fontSize: 11, letterSpacing: '0.15em' }}
                          >
                            LOAD →
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-5 pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center gap-3">
                    <p className="text-sm text-muted-foreground flex-1">
                      Don't see your league? Connect a different one from the home page.
                    </p>
                    <Button variant="outline" onClick={() => navigate('/')}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Connect Another League
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Load a league to export</CardTitle>
                  <CardDescription>
                    Connect a Sleeper league on the home page and we'll bring you back here ready to export.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Button onClick={() => navigate('/')}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Connect a League
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="tutorial" className="space-y-8">
            {/* Step 1 */}
            <Card className="fade-in hover-lift gradient-border">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white">Step 1</Badge>
                  <CardTitle className="text-white text-2xl">Export Your Data</CardTitle>
                </div>
                <CardDescription className="text-gray-300 text-lg">
                  Use SleeperSheets to download clean, formatted CSV files from your Sleeper league
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="glass p-6 rounded-xl">
                  <ul className="text-gray-200 space-y-3 list-disc list-inside">
                    <li><strong className="text-emerald-300">Enter your League ID</strong> or username to connect to your Sleeper league</li>
                    <li><strong className="text-emerald-300">Preview your data</strong> in the interactive dashboard to verify everything looks correct</li>
                    <li><strong className="text-emerald-300">Download CSV files</strong> for rosters, transactions, and draft data</li>
                    <li><strong className="text-emerald-300">Clean format guaranteed</strong> - no IDs or raw data, just readable information</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card className="fade-in hover-lift gradient-border" style={{ animationDelay: '0.1s' }}>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">Step 2</Badge>
                  <CardTitle className="text-white text-2xl">Upload to ChatGPT</CardTitle>
                </div>
                <CardDescription className="text-gray-300 text-lg">
                  Let AI transform your data into professional spreadsheet analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="glass p-6 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-white text-lg flex items-center">
                      <Sparkles className="w-5 h-5 mr-2 text-primary" />
                      Copy this prompt to ChatGPT:
                    </h4>
                    <Button onClick={copyToClipboard} variant="outline" size="sm">
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Prompt
                    </Button>
                  </div>
                  <div className="bg-slate-900/80 rounded-lg p-4 border border-slate-700">
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
                      {chatGptPrompt}
                    </pre>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="glass p-4 rounded-xl">
                    <h5 className="font-semibold text-emerald-300 mb-2 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      What You'll Get:
                    </h5>
                    <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                      <li>Individual team sheets with salary totals</li>
                      <li>Main summary with team comparisons</li>
                      <li>Transaction history analysis</li>
                      <li>Professional formatting and styling</li>
                    </ul>
                  </div>
                  <div className="glass p-4 rounded-xl">
                    <h5 className="font-semibold text-blue-300 mb-2 flex items-center">
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      Pro Tips:
                    </h5>
                    <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                      <li>Upload all CSV files at once for best results</li>
                      <li>Ask ChatGPT for additional analysis</li>
                      <li>Request custom charts and visualizations</li>
                      <li>Export as Excel for sharing with league mates</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card className="fade-in hover-lift gradient-border" style={{ animationDelay: '0.2s' }}>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">Step 3</Badge>
                  <CardTitle className="text-white text-2xl">Analyze & Share</CardTitle>
                </div>
                <CardDescription className="text-gray-300 text-lg">
                  Use your professional spreadsheet for league insights and strategic planning
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="glass p-6 rounded-xl">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full p-3 w-16 h-16 mx-auto mb-3">
                        <FileSpreadsheet className="w-10 h-10 text-white" />
                      </div>
                      <h5 className="font-semibold text-emerald-300 mb-2">Team Analysis</h5>
                      <p className="text-sm text-gray-300">Compare roster values, identify strengths and weaknesses</p>
                    </div>
                    <div className="text-center">
                      <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-full p-3 w-16 h-16 mx-auto mb-3">
                        <Bot className="w-10 h-10 text-white" />
                      </div>
                      <h5 className="font-semibold text-blue-300 mb-2">AI Insights</h5>
                      <p className="text-sm text-gray-300">Ask ChatGPT for trade recommendations and strategies</p>
                    </div>
                    <div className="text-center">
                      <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-full p-3 w-16 h-16 mx-auto mb-3">
                        <Sparkles className="w-10 h-10 text-white" />
                      </div>
                      <h5 className="font-semibold text-purple-300 mb-2">League Reports</h5>
                      <p className="text-sm text-gray-300">Share professional reports with your league</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
    </StaticPageLayout>
  );

  return <ExportContent />;
};

export default Export;

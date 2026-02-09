
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Copy, CheckCircle, Sparkles, FileSpreadsheet, Bot, Download } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { LeagueDataProvider } from '@/components/LeagueDataProvider';
import ExportActions from '@/components/ExportActions';

const Export = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const leagueData = location.state?.leagueData;

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
    <div className="min-h-screen">
      {/* Header */}
      <div className="glass-header border-b border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-emerald-600/10 animate-pulse"></div>
        <div className="max-w-6xl mx-auto px-4 py-8 relative z-10">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-600 rounded-2xl p-4 shadow-2xl pulse-glow">
              <Download className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">Export & Analytics</h1>
              <p className="text-gray-300 text-lg">Download your data and create professional league reports</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
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
                  userMap={leagueData.users.reduce((acc: any, user: any) => {
                    acc[user.user_id] = user;
                    return acc;
                  }, {})}
                  rosterUserMap={leagueData.rosters.reduce((acc: any, roster: any) => {
                    const user = leagueData.users.find((u: any) => u.user_id === roster.owner_id);
                    acc[roster.roster_id] = user;
                    return acc;
                  }, {})}
                  players={leagueData.players}
                  transactions={leagueData.transactions || []}
                  draftPicks={leagueData.draftPicks || []}
                />
              </LeagueDataProvider>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Export Your League Data</CardTitle>
                  <CardDescription>
                    To export your league data, please go back to the main page and load your league first.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-4">
                      Export functionality is available after loading league data on the main page.
                    </p>
                    <Button onClick={() => navigate(-1)}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Return to Home
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
                      <Sparkles className="w-5 h-5 mr-2 text-yellow-400" />
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
      </div>
    </div>
  );

  return <ExportContent />;
};

export default Export;

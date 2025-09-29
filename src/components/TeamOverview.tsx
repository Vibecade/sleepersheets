import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Trophy, Calendar, Activity, RefreshCw, ArrowRightLeft } from 'lucide-react';
import { useMatchups } from '@/hooks/useMatchups';
import { useHistoricalMatchups } from '@/hooks/useHistoricalMatchups';
import { useHistoricalProjections } from '@/hooks/useHistoricalProjections';
import { useTransactionProcessor } from '@/hooks/useTransactionProcessor';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import ErrorBoundaryWithRetry from './ErrorBoundaryWithRetry';

// Lazy load tab components for better code splitting
const MatchupsTab = lazy(() => import('./tabs/MatchupsTab'));
const StandingsTab = lazy(() => import('./tabs/StandingsTab'));
const TransactionsTab = lazy(() => import('./tabs/TransactionsTab'));
const StatisticsTab = lazy(() => import('./tabs/StatisticsTab'));

interface TeamOverviewProps {
  league: any;
  rosters: any[];
  userMap: Record<string, any>;
  players: Record<string, any>;
  transactions?: any[];
  onResyncData?: () => void;
}

const TeamOverview: React.FC<TeamOverviewProps> = ({
  league,
  rosters,
  userMap,
  players,
  transactions = [],
  onResyncData
}) => {
  const [selectedWeek, setSelectedWeek] = useState(league?.settings?.leg || 1);
  const [showBonusWins, setShowBonusWins] = useState(false);
  const [expandedTeamId, setExpandedTeamId] = useState<number | null>(null);
  const { matchups, loading: matchupsLoading, getCurrentNFLWeek } = useMatchups(league?.league_id, selectedWeek);
  const { processWaiverTransactions, processing: processingTransactions } = useTransactionProcessor();
  
  // Get projections for current week
  const currentWeek = getCurrentNFLWeek();
  const { historicalMatchups, teamWeeklyData, weeklyAverages, loading: historicalLoading } = useHistoricalMatchups(league?.league_id || '', currentWeek);

  // Process waiver transactions when data loads
  useEffect(() => {
    if (league?.league_id && transactions?.length && !processingTransactions) {
      processWaiverTransactions(league.league_id, transactions);
    }
  }, [league?.league_id, transactions, processWaiverTransactions, processingTransactions]);
  
  const { projections, loading: projectionsLoading } = useHistoricalProjections(
    league?.league_id || '',
    currentWeek
  );

  // Group matchups by matchup_id
  const groupedMatchups = matchups.reduce((acc, matchup) => {
    if (!acc[matchup.matchup_id]) {
      acc[matchup.matchup_id] = [];
    }
    acc[matchup.matchup_id].push(matchup);
    return acc;
  }, {} as Record<number, typeof matchups>);

  const formatPoints = (points: number) => {
    return points?.toFixed(1) || '0.0';
  };

  const getRosterById = (rosterId: number) => {
    return rosters.find(r => r.roster_id === rosterId);
  };

  const getTeamRecord = (roster: any) => {
    const wins = roster.settings?.wins || 0;
    const losses = roster.settings?.losses || 0;
    const ties = roster.settings?.ties || 0;
    return `${wins}-${losses}${ties > 0 ? `-${ties}` : ''}`;
  };

  // Calculate bonus wins from enhanced weekly data
  const teamBonusWins = useMemo(() => {
    if (!teamWeeklyData.length || !showBonusWins) {
      return {};
    }
    
    const bonusWins: Record<number, number> = {};
    teamWeeklyData.forEach(({ rosterId, weeklyPerformance }) => {
      bonusWins[rosterId] = weeklyPerformance.filter(week => week.aboveAverage).length;
    });
    
    return bonusWins;
  }, [teamWeeklyData, showBonusWins]);

  const getTeamRecordWithBonus = (roster: any) => {
    const wins = roster.settings?.wins || 0;
    const losses = roster.settings?.losses || 0;
    const ties = roster.settings?.ties || 0;
    const bonusWins = teamBonusWins[roster.roster_id] || 0;
    
    if (showBonusWins && bonusWins > 0) {
      return `${wins + bonusWins}-${losses}${ties > 0 ? `-${ties}` : ''} (+${bonusWins})`;
    }
    return `${wins}-${losses}${ties > 0 ? `-${ties}` : ''}`;
  };

  const handleTeamToggle = (rosterId: number) => {
    setExpandedTeamId(expandedTeamId === rosterId ? null : rosterId);
  };

  return (
    <div className="space-y-6">
      {/* League Header */}
      <Card className="transition-all duration-300 hover:shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Trophy className="w-6 h-6 text-yellow-500" />
              <div>
                <CardTitle className="text-2xl transition-colors duration-200">{league?.name}</CardTitle>
                <p className="text-gray-400 transition-colors duration-200">
                  {league?.season} Season • Week {league?.settings?.leg || 1}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {onResyncData && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onResyncData}
                  className="transition-all duration-200 hover:scale-105 touch-manipulation active:scale-95"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Re-sync Data
                </Button>
              )}
              <Badge variant="outline" className="text-green-400 border-green-400 transition-all duration-200 hover:bg-green-400/10">
                {rosters.length} Teams
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="matchups" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 transition-all duration-200">
          <TabsTrigger 
            value="matchups" 
            className="flex items-center space-x-2 transition-all duration-200 hover:bg-accent/80 touch-manipulation active:scale-95"
          >
            <Calendar className="w-4 h-4" />
            <span>Matchups</span>
          </TabsTrigger>
          <TabsTrigger 
            value="standings" 
            className="flex items-center space-x-2 transition-all duration-200 hover:bg-accent/80 touch-manipulation active:scale-95"
          >
            <Users className="w-4 h-4" />
            <span>Standings</span>
          </TabsTrigger>
          <TabsTrigger 
            value="transactions" 
            className="flex items-center space-x-2 transition-all duration-200 hover:bg-accent/80 touch-manipulation active:scale-95"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Transactions</span>
          </TabsTrigger>
          <TabsTrigger 
            value="statistics" 
            className="flex items-center space-x-2 transition-all duration-200 hover:bg-accent/80 touch-manipulation active:scale-95"
          >
            <Activity className="w-4 h-4" />
            <span>Fun Stats</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matchups" className="animate-fade-in">
          <ErrorBoundaryWithRetry fallbackMessage="Failed to load matchups. Please try again.">
            <Suspense fallback={<SkeletonCard />}>
              <MatchupsTab
                selectedWeek={selectedWeek}
                setSelectedWeek={setSelectedWeek}
                matchupsLoading={matchupsLoading}
                groupedMatchups={groupedMatchups}
                getRosterById={getRosterById}
                userMap={userMap}
                players={players}
                formatPoints={formatPoints}
                getTeamRecord={getTeamRecord}
              />
            </Suspense>
          </ErrorBoundaryWithRetry>
        </TabsContent>

        <TabsContent value="standings" className="animate-fade-in">
          <ErrorBoundaryWithRetry fallbackMessage="Failed to load standings. Please try again.">
            <Suspense fallback={<SkeletonCard />}>
              <StandingsTab
                rosters={rosters}
                userMap={userMap}
                showBonusWins={showBonusWins}
                setShowBonusWins={setShowBonusWins}
                historicalLoading={historicalLoading}
                historicalMatchups={historicalMatchups}
                teamBonusWins={teamBonusWins}
                teamWeeklyData={teamWeeklyData}
                weeklyAverages={weeklyAverages}
                expandedTeamId={expandedTeamId}
                getTeamRecordWithBonus={getTeamRecordWithBonus}
                getTeamRecord={getTeamRecord}
                handleTeamToggle={handleTeamToggle}
              />
            </Suspense>
          </ErrorBoundaryWithRetry>
        </TabsContent>

        <TabsContent value="transactions" className="animate-fade-in">
          <ErrorBoundaryWithRetry fallbackMessage="Failed to load transactions. Please try again.">
            <Suspense fallback={<SkeletonCard />}>
              <TransactionsTab
                transactions={transactions}
                userMap={userMap}
                players={players}
                league={league}
              />
            </Suspense>
          </ErrorBoundaryWithRetry>
        </TabsContent>

        <TabsContent value="statistics" className="animate-fade-in">
          <ErrorBoundaryWithRetry fallbackMessage="Failed to load statistics. Please try again.">
            <Suspense fallback={<SkeletonCard />}>
              <StatisticsTab
                league={league}
                rosters={rosters}
                players={players}
                userMap={userMap}
              />
            </Suspense>
          </ErrorBoundaryWithRetry>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeamOverview;

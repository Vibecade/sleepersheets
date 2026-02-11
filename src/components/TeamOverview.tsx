import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Trophy, Calendar, Activity, RefreshCw, ArrowRightLeft } from 'lucide-react';
import { useMatchups } from '@/hooks/useMatchups';
import { useHistoricalMatchups } from '@/hooks/useHistoricalMatchups';
import { useTransactionProcessor } from '@/hooks/useTransactionProcessor';
import { SkeletonCard } from '@/components/ui/skeleton-card';
import ErrorBoundaryWithRetry from './ErrorBoundaryWithRetry';
import { useIsMobile } from '@/hooks/use-mobile';
import { getCurrentNFLWeek } from '@/utils/nflWeek';

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
  initialTab?: string;
}

const TeamOverview: React.FC<TeamOverviewProps> = ({
  league,
  rosters,
  userMap,
  players,
  transactions = [],
  onResyncData,
  initialTab
}) => {
  const isMobile = useIsMobile();
  const currentWeek = useMemo(() => getCurrentNFLWeek(league?.season), [league?.season]);

  // Initialize selectedWeek to current NFL week instead of hardcoded 1
  const [selectedWeek, setSelectedWeek] = useState(currentWeek);
  const [showBonusWins, setShowBonusWins] = useState(false);
  const [expandedTeamId, setExpandedTeamId] = useState<number | null>(null);
  
  const { matchups, loading: matchupsLoading } = useMatchups(league?.league_id, selectedWeek);
  const { processWaiverTransactions, processing: processingTransactions } = useTransactionProcessor();
  const { historicalMatchups, teamWeeklyData, weeklyAverages, loading: historicalLoading } = useHistoricalMatchups(league?.league_id || '', currentWeek);

  // Process waiver transactions when data loads
  useEffect(() => {
    if (league?.league_id && transactions?.length && !processingTransactions) {
      processWaiverTransactions(league.league_id, transactions);
    }
  }, [league?.league_id, transactions, processWaiverTransactions, processingTransactions]);

  // Keep selected week aligned when switching between leagues/seasons.
  useEffect(() => {
    setSelectedWeek(currentWeek);
  }, [currentWeek]);

  // Group matchups by matchup_id
  const groupedMatchups = useMemo(() => {
    return matchups.reduce((acc, matchup) => {
      if (!acc[matchup.matchup_id]) {
        acc[matchup.matchup_id] = [];
      }
      acc[matchup.matchup_id].push(matchup);
      return acc;
    }, {} as Record<number, typeof matchups>);
  }, [matchups]);

  const formatPoints = (points: number) => {
    return points?.toFixed(2) || '0.00';
  };

  const rosterById = useMemo(() => {
    return rosters.reduce<Record<number, any>>((acc, roster) => {
      acc[roster.roster_id] = roster;
      return acc;
    }, {});
  }, [rosters]);

  const getRosterById = useCallback((rosterId: number) => {
    return rosterById[rosterId];
  }, [rosterById]);

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

  const handleTeamToggle = useCallback((rosterId: number) => {
    setExpandedTeamId((prevTeamId) => (prevTeamId === rosterId ? null : rosterId));
  }, []);

  return (
    <div className="space-y-4 md:space-y-6 lg:space-y-8">
      {!isMobile && (
        <Card className="hover-lift border border-border/50">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30">
                  <Trophy className="w-7 h-7 text-yellow-500" />
                </div>
                <div>
                  <CardTitle className="text-2xl lg:text-3xl mb-1">{league?.name}</CardTitle>
                  <p className="text-muted-foreground text-base">
                    {league?.season} Season <span className="mx-2">•</span> Week {currentWeek}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {onResyncData && (
                  <Button
                    variant="outline"
                    size="default"
                    onClick={onResyncData}
                    className="hover-border-glow"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Re-sync Data
                  </Button>
                )}
                <Badge variant="outline" className="text-lg px-4 py-1.5 text-green-400 border-green-400/50 bg-green-400/5 hover:bg-green-400/10 transition-colors">
                  {rosters.length} Teams
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      <Tabs defaultValue={initialTab || "matchups"} className="space-y-4 md:space-y-6">
        <TabsList className="flex w-full gap-1">
          <TabsTrigger
            value="matchups"
            className="flex-1 flex items-center justify-center gap-1.5 md:gap-2"
          >
            <Calendar className="w-4 h-4 shrink-0" />
            <span className="hidden xs:inline text-xs md:text-sm">Matchups</span>
          </TabsTrigger>
          <TabsTrigger
            value="standings"
            className="flex-1 flex items-center justify-center gap-1.5 md:gap-2"
          >
            <Users className="w-4 h-4 shrink-0" />
            <span className="hidden xs:inline text-xs md:text-sm">Standings</span>
          </TabsTrigger>
          <TabsTrigger
            value="transactions"
            className="flex-1 flex items-center justify-center gap-1.5 md:gap-2"
          >
            <ArrowRightLeft className="w-4 h-4 shrink-0" />
            <span className="hidden xs:inline text-xs md:text-sm">Moves</span>
          </TabsTrigger>
          <TabsTrigger
            value="statistics"
            className="flex-1 flex items-center justify-center gap-1.5 md:gap-2"
          >
            <Activity className="w-4 h-4 shrink-0" />
            <span className="hidden xs:inline text-xs md:text-sm">Stats</span>
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

import React, { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Activity, AlertTriangle, ArrowRightLeft, Trophy, TrendingUp, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { getTeamName } from '@/utils/leagueDataUtils';
import { useGamificationInsights } from '@/hooks/useGamificationInsights';
import { useQuestSnapshots } from '@/hooks/useQuestSnapshots';

interface GamificationHubProps {
  league: any;
  rosters: any[];
  players: Record<string, any>;
  userMap: Record<string, any>;
  transactions: any[];
}

interface QuestItem {
  id: string;
  title: string;
  current: number;
  target: number;
  hint: string;
}

const RISK_STATUS_KEYWORDS = ['out', 'doubtful', 'questionable', 'injur', 'ir', 'suspend'];

const formatRecord = (roster: any) => {
  const wins = roster?.settings?.wins || 0;
  const losses = roster?.settings?.losses || 0;
  const ties = roster?.settings?.ties || 0;
  return `${wins}-${losses}${ties > 0 ? `-${ties}` : ''}`;
};

const formatPlayerName = (player: any, fallback: string) => {
  const fullName = player?.full_name;
  if (typeof fullName === 'string' && fullName.trim()) {
    return fullName.trim();
  }

  const joined = `${player?.first_name || ''} ${player?.last_name || ''}`.trim();
  return joined || fallback;
};

const GamificationHub: React.FC<GamificationHubProps> = ({
  league,
  rosters,
  players,
  userMap,
  transactions,
}) => {
  const leagueId = league?.league_id;
  const { data, isLoading, isFetching } = useGamificationInsights({
    leagueId,
    season: league?.season,
    leagueWeek: league?.settings?.week,
  });

  const rosterById = useMemo(() => {
    const map = new Map<number, any>();
    rosters.forEach((roster) => map.set(roster.roster_id, roster));
    return map;
  }, [rosters]);

  const teamNameByRosterId = useMemo(() => {
    const map = new Map<number, string>();
    rosters.forEach((roster) => {
      const user = userMap[roster.owner_id];
      map.set(roster.roster_id, getTeamName(user));
    });
    return map;
  }, [rosters, userMap]);

  const getTeamLabel = (rosterId: number) => teamNameByRosterId.get(rosterId) || `Team ${rosterId}`;

  const rivalryGame = useMemo(() => {
    const grouped = new Map<number, any[]>();
    data.matchups.forEach((matchup) => {
      if (!grouped.has(matchup.matchup_id)) {
        grouped.set(matchup.matchup_id, []);
      }
      grouped.get(matchup.matchup_id)?.push(matchup);
    });

    const pairs: Array<{
      diff: number;
      combinedPoints: number;
      home: any;
      away: any;
    }> = [];

    grouped.forEach((matchups) => {
      if (!matchups || matchups.length < 2) return;
      const [home, away] = matchups;
      const homePoints = Number(home.points || 0);
      const awayPoints = Number(away.points || 0);
      pairs.push({
        diff: Math.abs(homePoints - awayPoints),
        combinedPoints: homePoints + awayPoints,
        home,
        away,
      });
    });

    pairs.sort((a, b) => a.diff - b.diff || b.combinedPoints - a.combinedPoints);
    return pairs[0] || null;
  }, [data.matchups]);

  const bracketRosterIds = useMemo(() => {
    const ids = new Set<number>();
    [...data.winnersBracket, ...data.losersBracket].forEach((entry) => {
      ['w', 'l', 't1', 't2'].forEach((field) => {
        const value = entry?.[field];
        if (typeof value === 'number' && value > 0) {
          ids.add(value);
        }
      });
    });
    return ids;
  }, [data.winnersBracket, data.losersBracket]);

  const standings = useMemo(() => {
    return [...rosters].sort((a, b) => {
      const aWins = a?.settings?.wins || 0;
      const bWins = b?.settings?.wins || 0;
      if (bWins !== aWins) {
        return bWins - aWins;
      }
      const aPoints = a?.settings?.fpts || 0;
      const bPoints = b?.settings?.fpts || 0;
      return bPoints - aPoints;
    });
  }, [rosters]);

  const playoffTeams = Math.max(2, Number(league?.settings?.playoff_teams || Math.ceil(rosters.length * 0.4)));
  const bubbleTeams = standings.slice(Math.max(0, playoffTeams - 1), Math.min(standings.length, playoffTeams + 2));

  const contestedAdds = useMemo(() => {
    const addCount = new Map<string, number>();
    transactions.forEach((transaction) => {
      if (transaction?.status !== 'complete') return;
      const adds = transaction?.adds || {};
      Object.keys(adds).forEach((playerId) => {
        addCount.set(playerId, (addCount.get(playerId) || 0) + 1);
      });
    });

    return Array.from(addCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([playerId, count]) => ({
        playerId,
        count,
        playerName: formatPlayerName(players[playerId], playerId),
      }));
  }, [transactions, players]);

  const topWaiver = useMemo(() => {
    return [...transactions]
      .filter((transaction) => transaction?.type === 'waiver' && transaction?.status === 'complete')
      .sort((a, b) => (b?.settings?.waiver_bid || 0) - (a?.settings?.waiver_bid || 0))[0];
  }, [transactions]);

  const draftCapitalLeaders = useMemo(() => {
    const netByRoster = new Map<number, number>();
    data.tradedPicks.forEach((pick) => {
      if (typeof pick.previous_owner_id === 'number') {
        netByRoster.set(pick.previous_owner_id, (netByRoster.get(pick.previous_owner_id) || 0) - 1);
      }
      if (typeof pick.owner_id === 'number') {
        netByRoster.set(pick.owner_id, (netByRoster.get(pick.owner_id) || 0) + 1);
      }
    });

    return Array.from(netByRoster.entries())
      .filter(([, net]) => net !== 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([rosterId, net]) => ({
        rosterId,
        net,
        teamName: teamNameByRosterId.get(rosterId) || `Team ${rosterId}`,
      }));
  }, [data.tradedPicks, teamNameByRosterId]);

  const teamsWithSetLineups = rosters.filter((roster) =>
    Array.isArray(roster?.starters) && roster.starters.some((playerId: string) => playerId && playerId !== '0')
  ).length;

  const waiverActiveTeams = useMemo(() => {
    const active = new Set<number>();
    transactions.forEach((transaction) => {
      if (transaction?.type !== 'waiver' || transaction?.status !== 'complete') return;
      (transaction?.roster_ids || []).forEach((rosterId: number) => {
        if (typeof rosterId === 'number') {
          active.add(rosterId);
        }
      });
    });
    return active.size;
  }, [transactions]);

  const closeGameTeams = useMemo(() => {
    const grouped = new Map<number, any[]>();
    data.matchups.forEach((matchup) => {
      if (!grouped.has(matchup.matchup_id)) {
        grouped.set(matchup.matchup_id, []);
      }
      grouped.get(matchup.matchup_id)?.push(matchup);
    });

    let count = 0;
    grouped.forEach((matchups) => {
      if (!matchups || matchups.length < 2) return;
      const [a, b] = matchups;
      const diff = Math.abs(Number(a.points || 0) - Number(b.points || 0));
      if (diff <= 10) {
        count += 2;
      }
    });
    return count;
  }, [data.matchups]);

  const weeklyQuests: QuestItem[] = [
    {
      id: 'lineups',
      title: 'Set Active Lineups',
      current: teamsWithSetLineups,
      target: Math.max(1, rosters.length),
      hint: 'Keep every team active before kickoff.',
    },
    {
      id: 'waiver',
      title: 'Waiver Wire Activity',
      current: waiverActiveTeams,
      target: Math.max(1, Math.ceil(rosters.length * 0.4)),
      hint: 'Target at least 40% manager participation.',
    },
    {
      id: 'close-games',
      title: 'Close Matchup Week',
      current: closeGameTeams,
      target: Math.max(2, Math.ceil(rosters.length * 0.3)),
      hint: 'Tight matchups keep league engagement high.',
    },
  ];

  const {
    currentSnapshot,
    history: questSnapshotHistory,
    isSaving: isSavingSnapshot,
    saveError: questSnapshotError,
    canPersist: canPersistSnapshots,
  } = useQuestSnapshots({
    leagueId,
    season: league?.season || String(new Date().getFullYear()),
    week: data.week,
    quests: weeklyQuests,
  });

  const injuryRiskPlayers = useMemo(() => {
    const seen = new Set<string>();
    const riskEntries: Array<{ playerId: string; name: string; teamName: string; status: string }> = [];

    rosters.forEach((roster) => {
      const teamName = teamNameByRosterId.get(roster.roster_id) || `Team ${roster.roster_id}`;
      const starters = Array.isArray(roster?.starters) ? roster.starters : [];
      starters.forEach((playerId: string) => {
        if (!playerId || playerId === '0' || seen.has(playerId)) return;
        const player = players[playerId];
        if (!player) return;

        const statusValue = String(player?.injury_status || player?.status || '').trim();
        if (!statusValue) return;
        const normalizedStatus = statusValue.toLowerCase();
        if (!RISK_STATUS_KEYWORDS.some((keyword) => normalizedStatus.includes(keyword))) return;

        seen.add(playerId);
        riskEntries.push({
          playerId,
          name: formatPlayerName(player, playerId),
          teamName,
          status: statusValue,
        });
      });
    });

    return riskEntries.slice(0, 5);
  }, [rosters, players, teamNameByRosterId]);

  return (
    <Card className="transition-all duration-150 hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            <CardTitle className="text-base sm:text-lg">League Pulse</CardTitle>
          </div>
          {isFetching ? <Badge variant="outline">Refreshing</Badge> : <Badge variant="secondary">Week {data.week}</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">
          Live engagement signals powered by Sleeper endpoints.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="rounded-lg border border-border/60 p-4 space-y-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-lg border border-border/60 bg-card/40 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Users className="w-4 h-4 text-primary" />
                Rivalry Of The Week
              </div>
              {rivalryGame ? (
                <div className="space-y-1 text-sm">
                  <p className="font-medium">
                    {getTeamLabel(rivalryGame.home.roster_id)} vs {getTeamLabel(rivalryGame.away.roster_id)}
                  </p>
                  <p className="text-muted-foreground">
                    Margin: {rivalryGame.diff.toFixed(2)} pts | Combined: {rivalryGame.combinedPoints.toFixed(2)} pts
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No rivalry matchup identified yet this week.</p>
              )}
            </div>

            <div className="rounded-lg border border-border/60 bg-card/40 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="w-4 h-4 text-primary" />
                Playoff Pulse
              </div>
              <p className="text-sm text-muted-foreground">
                {bracketRosterIds.size > 0
                  ? `${bracketRosterIds.size} teams currently mapped in bracket slots.`
                  : 'Bracket data not published yet; using standings race.'}
              </p>
              {bubbleTeams.length > 0 && (
                <div className="space-y-1 text-xs">
                  {bubbleTeams.map((roster) => (
                    <p key={roster.roster_id}>
                      {getTeamLabel(roster.roster_id)} ({formatRecord(roster)})
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-border/60 bg-card/40 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ArrowRightLeft className="w-4 h-4 text-primary" />
                Market Heat
              </div>
              <div className="space-y-1 text-xs">
                <p className="font-medium">Top Adds (24h):</p>
                {data.trendingAdds.slice(0, 3).map((entry) => (
                  <p key={`add-${entry.player_id}`}>
                    + {formatPlayerName(players[entry.player_id], entry.player_id)} ({entry.count || 0})
                  </p>
                ))}
                {topWaiver && (
                  <p className="text-muted-foreground mt-2">
                    Highest waiver: ${topWaiver?.settings?.waiver_bid || 0}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-border/60 bg-card/40 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Activity className="w-4 h-4 text-primary" />
                Draft Capital Race
              </div>
              {draftCapitalLeaders.length > 0 ? (
                <div className="space-y-1 text-xs">
                  {draftCapitalLeaders.map((leader) => (
                    <p key={leader.rosterId}>
                      {leader.teamName}: {leader.net > 0 ? '+' : ''}{leader.net} traded picks
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No traded pick movement tracked yet.</p>
              )}
            </div>

            <div className="rounded-lg border border-border/60 bg-card/40 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Trophy className="w-4 h-4 text-primary" />
                Weekly Quests
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                {canPersistSnapshots ? (
                  <>
                    <Badge variant="secondary">{isSavingSnapshot ? 'Saving snapshot...' : 'Snapshot synced'}</Badge>
                    {currentSnapshot?.updated_at && (
                      <span className="text-muted-foreground">
                        Updated {formatDistanceToNow(new Date(currentSnapshot.updated_at), { addSuffix: true })}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-muted-foreground">
                    Claim league ownership to persist weekly quest snapshots.
                  </span>
                )}
              </div>
              <div className="space-y-3">
                {weeklyQuests.map((quest) => {
                  const progress = Math.min(100, Math.round((quest.current / Math.max(quest.target, 1)) * 100));
                  const completed = quest.current >= quest.target;
                  return (
                    <div key={quest.id} className="space-y-1">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-medium">{quest.title}</span>
                        <Badge variant={completed ? 'default' : 'outline'}>
                          {quest.current}/{quest.target}
                        </Badge>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <p className="text-[11px] text-muted-foreground">{quest.hint}</p>
                    </div>
                  );
                })}
              </div>
              {questSnapshotHistory.length > 1 && (
                <div className="pt-2 border-t border-border/50">
                  <p className="text-[11px] font-medium mb-1">Recent Snapshot Trend</p>
                  <div className="flex flex-wrap gap-1.5">
                    {questSnapshotHistory.slice(0, 4).map((snapshot) => (
                      <Badge key={`${snapshot.season}-${snapshot.week}`} variant="outline" className="text-[10px]">
                        W{snapshot.week}: {snapshot.quest_points} pts
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {questSnapshotError && (
                <p className="text-[11px] text-destructive">{questSnapshotError}</p>
              )}
            </div>

            <div className="rounded-lg border border-border/60 bg-card/40 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <AlertTriangle className="w-4 h-4 text-primary" />
                Player Risk Radar
              </div>
              {injuryRiskPlayers.length > 0 ? (
                <div className="space-y-1 text-xs">
                  {injuryRiskPlayers.map((entry) => (
                    <p key={entry.playerId}>
                      {entry.name} ({entry.status}) - {entry.teamName}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No major starter injury flags detected.</p>
              )}
              {contestedAdds.length > 0 && (
                <p className="text-[11px] text-muted-foreground pt-1">
                  Most contested add: {contestedAdds[0].playerName} ({contestedAdds[0].count} adds)
                </p>
              )}
            </div>
          </div>
        )}

        {data.unavailableSources.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Some Sleeper endpoints were unavailable: {data.unavailableSources.join(', ')}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default GamificationHub;

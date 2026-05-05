import React, { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TurfPanel } from '@/components/ui/turf-panel';
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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-card border border-border p-5 space-y-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Two-column hero row: Rivalry + Playoff */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5">
        <TurfPanel
          kicker={`HEAD-TO-HEAD / WEEK ${data.week} / LIVE`}
          title="Rivalry of the Week"
          big
          action={
            isFetching ? (
              <Badge variant="outline">Refreshing</Badge>
            ) : (
              <span
                className="font-mono font-bold text-secondary px-2.5 py-1"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.15em',
                  background: 'hsl(var(--secondary) / 0.1)',
                }}
              >
                ● W{data.week}
              </span>
            )
          }
        >
          {rivalryGame ? (
            <div>
              <div className="grid grid-cols-[1fr_auto_1fr] gap-4 sm:gap-6 items-center">
                <div className="text-left">
                  <div
                    className="font-headline font-bold uppercase text-foreground"
                    style={{ fontSize: 16, letterSpacing: '0.025em', lineHeight: 1.1 }}
                  >
                    {getTeamLabel(rivalryGame.home.roster_id)}
                  </div>
                  <div
                    className="font-headline font-bold text-primary mt-2"
                    style={{ fontSize: 'clamp(36px, 5vw, 56px)', letterSpacing: '-0.03em', lineHeight: 0.9 }}
                  >
                    {Number(rivalryGame.home.points || 0).toFixed(1)}
                  </div>
                </div>
                <div className="text-center">
                  <div
                    className="font-headline font-bold text-muted-foreground"
                    style={{ fontSize: 11, letterSpacing: '0.25em', marginBottom: 6 }}
                  >
                    WEEK {data.week}
                  </div>
                  <div className="w-px h-12 sm:h-16 bg-border mx-auto" />
                </div>
                <div className="text-right">
                  <div
                    className="font-headline font-bold uppercase text-foreground"
                    style={{ fontSize: 16, letterSpacing: '0.025em', lineHeight: 1.1 }}
                  >
                    {getTeamLabel(rivalryGame.away.roster_id)}
                  </div>
                  <div
                    className="font-headline font-bold text-foreground mt-2"
                    style={{ fontSize: 'clamp(36px, 5vw, 56px)', letterSpacing: '-0.03em', lineHeight: 0.9 }}
                  >
                    {Number(rivalryGame.away.points || 0).toFixed(1)}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 mt-5 pt-4 border-t border-border">
                <div>
                  <div
                    className="font-mono text-muted-foreground mb-1"
                    style={{ fontSize: 9, letterSpacing: '0.2em' }}
                  >
                    GAP
                  </div>
                  <div
                    className="font-headline font-bold text-primary"
                    style={{ fontSize: 18, letterSpacing: '0.025em' }}
                  >
                    +{rivalryGame.diff.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div
                    className="font-mono text-muted-foreground mb-1"
                    style={{ fontSize: 9, letterSpacing: '0.2em' }}
                  >
                    COMBINED
                  </div>
                  <div
                    className="font-headline font-bold text-foreground"
                    style={{ fontSize: 18, letterSpacing: '0.025em' }}
                  >
                    {rivalryGame.combinedPoints.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No rivalry matchup identified yet this week.</p>
          )}
        </TurfPanel>

        <TurfPanel kicker={`TOP ${playoffTeams} ADVANCE`} title="Playoff Picture">
          <div className="flex flex-col gap-1">
            {standings.slice(0, Math.min(standings.length, playoffTeams + 1)).map((roster, index) => {
              const inPlayoffs = index < playoffTeams;
              return (
                <div
                  key={roster.roster_id}
                  className="grid grid-cols-[24px_1fr_50px] items-center gap-2 px-2.5 py-2"
                  style={{
                    background: inPlayoffs ? 'hsl(var(--card-light))' : 'transparent',
                    borderLeft: `3px solid ${inPlayoffs ? 'hsl(var(--primary))' : 'hsl(var(--border-light))'}`,
                    opacity: inPlayoffs ? 1 : 0.5,
                  }}
                >
                  <span
                    className={`font-headline font-bold ${inPlayoffs ? 'text-primary' : 'text-muted-foreground'}`}
                    style={{ fontSize: 16 }}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <div
                      className="text-[11px] font-semibold truncate text-foreground"
                      title={getTeamLabel(roster.roster_id)}
                    >
                      {getTeamLabel(roster.roster_id)}
                    </div>
                    <div
                      className="font-mono text-muted-foreground mt-0.5"
                      style={{ fontSize: 9, letterSpacing: '0.1em' }}
                    >
                      {formatRecord(roster)}
                    </div>
                  </div>
                  <span
                    className="font-mono text-muted-foreground text-right"
                    style={{ fontSize: 10 }}
                  >
                    {Math.round(roster?.settings?.fpts || 0)}
                  </span>
                </div>
              );
            })}
            {bracketRosterIds.size > 0 && (
              <p className="text-[10px] text-muted-foreground mt-2 px-2.5">
                {bracketRosterIds.size} teams currently mapped in bracket slots.
              </p>
            )}
          </div>
        </TurfPanel>
      </div>

      {/* Three-column row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <TurfPanel kicker="TOP ADDS / 24H" title="Market Heat">
          <div className="space-y-3">
            {data.trendingAdds.slice(0, 3).map((entry, i) => (
              <div key={`add-${entry.player_id}`} className="flex items-center gap-3">
                <span
                  className="font-headline font-bold text-primary flex-shrink-0"
                  style={{ fontSize: 24, letterSpacing: '-0.02em', minWidth: 22 }}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-foreground truncate">
                    {formatPlayerName(players[entry.player_id], entry.player_id)}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className="font-headline font-bold text-foreground"
                    style={{ fontSize: 16 }}
                  >
                    {entry.count || 0}
                  </div>
                  <div
                    className="font-mono text-primary"
                    style={{ fontSize: 9, letterSpacing: '0.1em' }}
                  >
                    ▲ ADDS
                  </div>
                </div>
              </div>
            ))}
            {data.trendingAdds.length === 0 && (
              <p className="text-sm text-muted-foreground">No trending adds tracked.</p>
            )}
            {topWaiver && (
              <p className="text-[10px] text-muted-foreground pt-2 border-t border-border">
                Highest waiver bid: ${topWaiver?.settings?.waiver_bid || 0}
              </p>
            )}
          </div>
        </TurfPanel>

        <TurfPanel kicker="ROOKIE PICKS" title="Draft Capital">
          <div className="space-y-3">
            {draftCapitalLeaders.length > 0 ? (
              draftCapitalLeaders.map((leader) => (
                <div key={leader.rosterId} className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-semibold text-foreground truncate">
                      {leader.teamName}
                    </div>
                    <div
                      className="font-mono text-muted-foreground mt-0.5"
                      style={{ fontSize: 9, letterSpacing: '0.15em' }}
                    >
                      NET POSITION
                    </div>
                  </div>
                  <span
                    className={`font-headline font-bold flex-shrink-0 ${
                      leader.net > 0 ? 'text-primary' : 'text-secondary'
                    }`}
                    style={{ fontSize: 22, letterSpacing: '-0.025em' }}
                  >
                    {leader.net > 0 ? '+' : ''}{leader.net}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No traded pick movement tracked yet.</p>
            )}
          </div>
        </TurfPanel>

        <TurfPanel kicker="INJURY WATCH" title="Risk Radar">
          <div className="space-y-2">
            {injuryRiskPlayers.length > 0 ? (
              injuryRiskPlayers.slice(0, 6).map((entry) => {
                const isIR = /\bir\b/i.test(entry.status);
                return (
                  <div
                    key={entry.playerId}
                    className="flex items-center gap-2.5 px-2 py-1.5"
                    style={{
                      background: 'hsl(var(--card-light))',
                      borderLeft: `2px solid ${isIR ? 'hsl(var(--secondary))' : 'hsl(var(--primary))'}`,
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-semibold text-foreground truncate">{entry.name}</div>
                      <div
                        className="font-mono text-muted-foreground"
                        style={{ fontSize: 9, letterSpacing: '0.1em' }}
                      >
                        {entry.teamName}
                      </div>
                    </div>
                    <span
                      className="font-mono font-bold flex-shrink-0 px-1.5 py-0.5"
                      style={{
                        fontSize: 9,
                        letterSpacing: '0.1em',
                        color: 'hsl(var(--primary-foreground))',
                        background: isIR ? 'hsl(var(--secondary))' : 'hsl(var(--primary))',
                      }}
                    >
                      {isIR ? 'IR' : 'Q'}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">No major starter injury flags detected.</p>
            )}
            {contestedAdds.length > 0 && (
              <p className="text-[10px] text-muted-foreground pt-2 border-t border-border">
                Most contested add: {contestedAdds[0].playerName} ({contestedAdds[0].count} adds)
              </p>
            )}
          </div>
        </TurfPanel>
      </div>

      {/* Weekly Quests row */}
      <TurfPanel
        kicker={`ENGAGEMENT TARGETS / WEEK ${data.week}`}
        title="Weekly Quests"
        action={
          canPersistSnapshots ? (
            <Badge variant="outline" className="font-mono text-[10px]">
              {isSavingSnapshot ? 'Saving snapshot…' : 'Snapshot synced'}
            </Badge>
          ) : null
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {weeklyQuests.map((quest) => {
            const pct = Math.min(100, Math.round((quest.current / Math.max(quest.target, 1)) * 100));
            const complete = quest.current >= quest.target;
            return (
              <div
                key={quest.id}
                className="p-4"
                style={{
                  background: 'hsl(var(--card-light))',
                  borderTop: `2px solid ${complete ? 'hsl(var(--primary))' : 'hsl(var(--secondary))'}`,
                }}
              >
                <div className="flex items-baseline justify-between gap-2 mb-1.5">
                  <span
                    className="font-headline font-bold uppercase text-foreground"
                    style={{ fontSize: 13, letterSpacing: '0.075em' }}
                  >
                    {quest.title}
                  </span>
                  <span
                    className={`font-headline font-bold ${complete ? 'text-primary' : 'text-foreground'}`}
                    style={{ fontSize: 22, letterSpacing: '-0.025em' }}
                  >
                    {quest.current}
                    <span className="text-muted-foreground" style={{ fontSize: 14 }}>
                      /{quest.target}
                    </span>
                  </span>
                </div>
                <div className="w-full h-1 bg-border relative overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0"
                    style={{
                      width: `${pct}%`,
                      background: complete ? 'hsl(var(--primary))' : 'hsl(var(--secondary))',
                      transition: 'width 0.6s cubic-bezier(.2,.8,.2,1)',
                    }}
                  />
                </div>
                <div
                  className="font-mono text-muted-foreground mt-2.5 leading-relaxed"
                  style={{ fontSize: 10, letterSpacing: '0.05em' }}
                >
                  {quest.hint}
                </div>
              </div>
            );
          })}
        </div>
        {questSnapshotHistory.length > 1 && (
          <div className="pt-3 mt-4 border-t border-border">
            <p
              className="font-mono text-muted-foreground mb-2"
              style={{ fontSize: 10, letterSpacing: '0.15em' }}
            >
              ● RECENT SNAPSHOTS
            </p>
            <div className="flex flex-wrap gap-1.5">
              {questSnapshotHistory.slice(0, 4).map((snapshot) => (
                <Badge
                  key={`${snapshot.season}-${snapshot.week}`}
                  variant="outline"
                  className="font-mono text-[10px]"
                >
                  W{snapshot.week}: {snapshot.quest_points} pts
                </Badge>
              ))}
            </div>
            {currentSnapshot?.updated_at && (
              <p className="text-[10px] text-muted-foreground mt-2">
                Updated{' '}
                {formatDistanceToNow(new Date(currentSnapshot.updated_at), { addSuffix: true })}
              </p>
            )}
          </div>
        )}
        {questSnapshotError && (
          <p className="text-[11px] text-destructive mt-3">{questSnapshotError}</p>
        )}
        {!canPersistSnapshots && (
          <p className="text-[11px] text-muted-foreground mt-3">
            Claim league ownership to persist weekly quest snapshots.
          </p>
        )}
      </TurfPanel>

      {data.unavailableSources.length > 0 && (
        <p className="text-xs text-muted-foreground px-1">
          Some Sleeper endpoints were unavailable: {data.unavailableSources.join(', ')}
        </p>
      )}
    </div>
  );
};

export default GamificationHub;

import { useMemo } from 'react';
import { getTeamName } from '@/utils/leagueDataUtils';
import type {
  GamificationInsightsPayload,
  SleeperMatchup,
} from '@/hooks/useGamificationInsights';
import type {
  SleeperLeague,
  SleeperPlayer,
  SleeperRoster,
  SleeperTransaction,
  SleeperUserMap,
} from '@/types/sleeper';

/**
 * Pure-data layer extracted from GamificationHub. Takes the upstream league
 * props plus the `useGamificationInsights` payload and returns every derived
 * value the panel renders — power rankings, rivalry of the week, contested
 * adds, top waiver, etc.
 *
 * Keeping this in a hook (a) makes each calculation independently testable
 * and (b) lets GamificationHub.tsx shrink to pure presentation.
 */

const RISK_STATUS_KEYWORDS = ['out', 'doubtful', 'questionable', 'injur', 'ir', 'suspend'];

export interface QuestItem {
  id: string;
  title: string;
  current: number;
  target: number;
  hint: string;
}

export const formatRecord = (roster: SleeperRoster | undefined): string => {
  const settings = (roster?.settings ?? {}) as { wins?: number; losses?: number; ties?: number };
  const wins = settings.wins ?? 0;
  const losses = settings.losses ?? 0;
  const ties = settings.ties ?? 0;
  return `${wins}-${losses}${ties > 0 ? `-${ties}` : ''}`;
};

export const formatPlayerName = (
  player: SleeperPlayer | undefined,
  fallback: string
): string => {
  const fullName = player?.full_name;
  if (typeof fullName === 'string' && fullName.trim()) {
    return fullName.trim();
  }

  const joined = `${player?.first_name || ''} ${player?.last_name || ''}`.trim();
  return joined || fallback;
};

interface UseGamificationDerivedDataParams {
  league: SleeperLeague;
  rosters: SleeperRoster[];
  players: Record<string, SleeperPlayer>;
  userMap: SleeperUserMap;
  transactions: SleeperTransaction[];
  insights: GamificationInsightsPayload;
}

export const useGamificationDerivedData = ({
  league,
  rosters,
  players,
  userMap,
  transactions,
  insights,
}: UseGamificationDerivedDataParams) => {
  const rosterById = useMemo(() => {
    const map = new Map<number, SleeperRoster>();
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

  const getTeamLabel = (rosterId: number) =>
    teamNameByRosterId.get(rosterId) || `Team ${rosterId}`;

  // Closest matchup of the current week — sorted by smallest point gap,
  // with combined points as a tiebreaker so two close 130+ point shootouts
  // beat two close 50-point dud games.
  const rivalryGame = useMemo(() => {
    const grouped = new Map<number, SleeperMatchup[]>();
    insights.matchups.forEach((matchup) => {
      if (!grouped.has(matchup.matchup_id)) {
        grouped.set(matchup.matchup_id, []);
      }
      grouped.get(matchup.matchup_id)?.push(matchup);
    });

    const pairs: Array<{
      diff: number;
      combinedPoints: number;
      home: SleeperMatchup;
      away: SleeperMatchup;
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
  }, [insights.matchups]);

  const bracketRosterIds = useMemo(() => {
    const ids = new Set<number>();
    [...insights.winnersBracket, ...insights.losersBracket].forEach((entry) => {
      ['w', 'l', 't1', 't2'].forEach((field) => {
        const value = entry?.[field];
        if (typeof value === 'number' && value > 0) {
          ids.add(value);
        }
      });
    });
    return ids;
  }, [insights.winnersBracket, insights.losersBracket]);

  const standings = useMemo(() => {
    return [...rosters].sort((a, b) => {
      // SleeperRoster.settings is Record<string, unknown>; coerce numerics.
      const aWins = Number(a?.settings?.wins || 0);
      const bWins = Number(b?.settings?.wins || 0);
      if (bWins !== aWins) {
        return bWins - aWins;
      }
      const aPoints = Number(a?.settings?.fpts || 0);
      const bPoints = Number(b?.settings?.fpts || 0);
      return bPoints - aPoints;
    });
  }, [rosters]);

  const playoffTeams = Math.max(
    2,
    Number(league?.settings?.playoff_teams || Math.ceil(rosters.length * 0.4))
  );
  const bubbleTeams = standings.slice(
    Math.max(0, playoffTeams - 1),
    Math.min(standings.length, playoffTeams + 2)
  );

  // Top 3 most-claimed players across completed transactions.
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
      .filter(
        (transaction) =>
          transaction?.type === 'waiver' && transaction?.status === 'complete'
      )
      .sort(
        (a, b) =>
          Number(b?.settings?.waiver_bid || 0) - Number(a?.settings?.waiver_bid || 0)
      )[0];
  }, [transactions]);

  // Net pick movement per roster from traded picks.
  const draftCapitalLeaders = useMemo(() => {
    const netByRoster = new Map<number, number>();
    insights.tradedPicks.forEach((pick) => {
      if (typeof pick.previous_owner_id === 'number') {
        netByRoster.set(
          pick.previous_owner_id,
          (netByRoster.get(pick.previous_owner_id) || 0) - 1
        );
      }
      if (typeof pick.owner_id === 'number') {
        netByRoster.set(
          pick.owner_id,
          (netByRoster.get(pick.owner_id) || 0) + 1
        );
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
  }, [insights.tradedPicks, teamNameByRosterId]);

  const teamsWithSetLineups = rosters.filter(
    (roster) =>
      Array.isArray(roster?.starters) &&
      roster.starters.some((playerId: string) => playerId && playerId !== '0')
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

  // Number of teams whose matchups landed within 10 points (counts both
  // teams in each close pairing).
  const closeGameTeams = useMemo(() => {
    const grouped = new Map<number, SleeperMatchup[]>();
    insights.matchups.forEach((matchup) => {
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
  }, [insights.matchups]);

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

  // Up to 5 starters with risky injury status; first occurrence wins
  // when a player appears on multiple rosters (shouldn't happen in
  // sleeper but defensively dedup).
  const injuryRiskPlayers = useMemo(() => {
    const seen = new Set<string>();
    const riskEntries: Array<{
      playerId: string;
      name: string;
      teamName: string;
      status: string;
    }> = [];

    rosters.forEach((roster) => {
      const teamName =
        teamNameByRosterId.get(roster.roster_id) || `Team ${roster.roster_id}`;
      const starters = Array.isArray(roster?.starters) ? roster.starters : [];
      starters.forEach((playerId: string) => {
        if (!playerId || playerId === '0' || seen.has(playerId)) return;
        const player = players[playerId];
        if (!player) return;

        const statusValue = String(player?.injury_status || player?.status || '').trim();
        if (!statusValue) return;
        const normalizedStatus = statusValue.toLowerCase();
        if (
          !RISK_STATUS_KEYWORDS.some((keyword) => normalizedStatus.includes(keyword))
        ) {
          return;
        }

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

  return {
    rosterById,
    teamNameByRosterId,
    getTeamLabel,
    rivalryGame,
    bracketRosterIds,
    standings,
    playoffTeams,
    bubbleTeams,
    contestedAdds,
    topWaiver,
    draftCapitalLeaders,
    teamsWithSetLineups,
    waiverActiveTeams,
    closeGameTeams,
    weeklyQuests,
    injuryRiskPlayers,
  };
};

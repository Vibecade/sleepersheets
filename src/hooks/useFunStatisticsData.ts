import { useMemo } from 'react';

/**
 * Pure-data layer extracted from FunStatistics. Computes the three
 * derived tables the panel renders — power rankings, streaks, and
 * manager activity — plus the offseason-detection flag the banner
 * keys on.
 *
 * Side benefit: the original code recomputed all three on every render
 * (no useMemo). Wrapping each in useMemo here makes them stable across
 * render passes too.
 */

const STREAK_PATTERN = /^(\d+)([WL])$/;

export interface PowerRankingRow {
  rosterId: number;
  teamName: string;
  user: any;
  powerScore: number;
  wins: number;
  losses: number;
  points: number;
  winPct: number;
  pointsVsAvg: number;
  trend: 'up' | 'down' | 'neutral';
  gamesPlayed: number;
}

export interface StreakRow {
  teamName: string;
  user: any;
  streak: number;
  streakType: 'win' | 'loss' | 'none';
  isHot: boolean;
  isCold: boolean;
}

export interface ActivityRow {
  teamName: string;
  user: any;
  transactionCount: number;
  activityLevel: 'high' | 'medium' | 'low';
}

const teamNameForUser = (user: any) =>
  user?.metadata?.team_name || user?.display_name || 'Unknown Team';

interface UseFunStatisticsDataParams {
  rosters: any[];
  userMap: Record<string, any>;
  transactions: any[];
}

export const useFunStatisticsData = ({
  rosters,
  userMap,
  transactions,
}: UseFunStatisticsDataParams) => {
  // Power rankings: weighted blend of normalized win % (0.65) and
  // normalized points (0.35). Trend reads from roster.metadata.streak
  // (e.g. "3W", "1L") and only flags up/down for streaks of 2+.
  const powerRankings = useMemo<PowerRankingRow[]>(() => {
    const allPoints = rosters.map((r) => r.settings?.fpts || 0);
    const maxPoints = allPoints.length > 0 ? Math.max(...allPoints) : 0;
    const avgPoints =
      allPoints.length > 0
        ? allPoints.reduce((sum, p) => sum + p, 0) / allPoints.length
        : 0;

    return rosters
      .map((roster) => {
        const user = userMap[roster.owner_id];
        const wins = roster.settings?.wins || 0;
        const losses = roster.settings?.losses || 0;
        const points = roster.settings?.fpts || 0;
        const gamesPlayed = wins + losses;
        const winPct = gamesPlayed > 0 ? wins / gamesPlayed : 0;

        const normalizedPoints = maxPoints > 0 ? points / maxPoints : 0;
        const powerScore = winPct * 0.65 + normalizedPoints * 0.35;

        let trend: PowerRankingRow['trend'] = 'neutral';
        const streakData: string = roster.metadata?.streak || '';
        const match = streakData.match(STREAK_PATTERN);
        if (match) {
          const streakCount = parseInt(match[1], 10);
          if (match[2] === 'W' && streakCount >= 2) trend = 'up';
          else if (match[2] === 'L' && streakCount >= 2) trend = 'down';
        }

        return {
          rosterId: roster.roster_id,
          teamName: teamNameForUser(user),
          user,
          powerScore,
          wins,
          losses,
          points,
          winPct,
          pointsVsAvg: points - avgPoints,
          trend,
          gamesPlayed,
        };
      })
      .sort((a, b) => b.powerScore - a.powerScore);
  }, [rosters, userMap]);

  // Streaks: prefer roster.metadata.streak when present (the live
  // Sleeper-tracked value); fall back to a coarse W vs L count for
  // teams without explicit streak data.
  const streaks = useMemo<StreakRow[]>(() => {
    return rosters.map((roster) => {
      const user = userMap[roster.owner_id];
      const wins = roster.settings?.wins || 0;
      const losses = roster.settings?.losses || 0;

      const streakData: string = roster.metadata?.streak || '';
      let streak = 0;
      let streakType: StreakRow['streakType'] = 'none';

      const match = streakData.match(STREAK_PATTERN);
      if (match) {
        streak = parseInt(match[1], 10);
        streakType = match[2] === 'W' ? 'win' : 'loss';
      } else if (wins > 0 || losses > 0) {
        streak = wins > losses ? wins : losses;
        streakType = wins > losses ? 'win' : 'loss';
      }

      return {
        teamName: teamNameForUser(user),
        user,
        streak,
        streakType,
        isHot: streakType === 'win' && streak >= 2,
        isCold: streakType === 'loss' && streak >= 2,
      };
    });
  }, [rosters, userMap]);

  // Most active managers — counts transactions where creator matches
  // the roster's owner_id. Threshold buckets: high (>10), medium (>5).
  const activity = useMemo<ActivityRow[]>(() => {
    const activityMap = new Map<string, number>();

    transactions.forEach((transaction) => {
      const creator = transaction.creator;
      if (creator) {
        activityMap.set(creator, (activityMap.get(creator) || 0) + 1);
      }
    });

    return rosters
      .map((roster) => {
        const user = userMap[roster.owner_id];
        const transactionCount = activityMap.get(roster.owner_id) || 0;
        const activityLevel: ActivityRow['activityLevel'] =
          transactionCount > 10 ? 'high' : transactionCount > 5 ? 'medium' : 'low';

        return {
          teamName: teamNameForUser(user),
          user,
          transactionCount,
          activityLevel,
        };
      })
      .sort((a, b) => b.transactionCount - a.transactionCount);
  }, [rosters, userMap, transactions]);

  // No team has played a game yet — show the "regular season hasn't
  // started" banner instead of an all-zero rankings table that looks
  // like a bug. PR #11 added this; the threshold is sum of W+L+T
  // across all rosters.
  const isPreseason = useMemo(() => {
    const totalGamesPlayed = rosters.reduce((sum, roster) => {
      const wins = roster.settings?.wins || 0;
      const losses = roster.settings?.losses || 0;
      const ties = roster.settings?.ties || 0;
      return sum + wins + losses + ties;
    }, 0);
    return totalGamesPlayed === 0;
  }, [rosters]);

  return {
    powerRankings,
    streaks,
    activity,
    isPreseason,
  };
};

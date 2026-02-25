import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cachedFetch } from '@/utils/apiCache';
import { useLeagueData } from '@/components/LeagueDataProvider';
import { fetchSleeperProjections, type SleeperProjection } from '@/utils/leagueApi';
import type { Matchup } from './useMatchups';
import { CACHE_TTL } from '@/utils/constants';
import { logger } from '@/utils/logger';

export interface ProjectionData {
  rosterId: number;
  projectedPoints: number;
  confidence: number;
  historicalAverage?: number;
  trendAdjustment?: number;
  opponentAdjustment?: number;
  projectionType: 'historical' | 'draft-based' | 'sleeper';
  gameStatus?: 'not-played' | 'in-progress' | 'completed' | 'poor-performance';
  source: 'sleeper' | 'historical' | 'draft';
}

export interface WeeklyProjections {
  [rosterId: number]: ProjectionData;
}

interface HistoricalMatchup extends Matchup {
  week: number;
}

const POSITION_BASELINES = {
  QB: { base: 20, variance: 5 },
  RB: { base: 12, variance: 8 },
  WR: { base: 10, variance: 6 },
  TE: { base: 8, variance: 4 },
  K: { base: 8, variance: 3 },
  DEF: { base: 8, variance: 4 },
} as const;

const getGameStatus = (
  currentPoints: number
): 'not-played' | 'in-progress' | 'completed' | 'poor-performance' => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const hour = now.getHours();

  if (currentPoints === 0) {
    if (dayOfWeek < 4 || (dayOfWeek === 4 && hour < 20)) {
      return 'not-played';
    }
    if (dayOfWeek === 5 || dayOfWeek === 6 || (dayOfWeek === 0 && hour < 13)) {
      return 'not-played';
    }
    return 'poor-performance';
  }

  if (currentPoints > 0 && currentPoints < 50) {
    if (dayOfWeek === 0 || (dayOfWeek === 1 && hour < 23)) {
      return 'in-progress';
    }
  }

  return 'completed';
};

export const useHistoricalProjections = (
  leagueId: string,
  currentWeek: number,
  currentMatchups?: Matchup[]
) => {
  const { rosters, players, league } = useLeagueData();
  const season = league?.season || '2025';

  const sleeperProjectionsQuery = useQuery<Record<string, SleeperProjection> | null, Error>({
    queryKey: ['sleeper-projections', leagueId, currentWeek, season],
    enabled: Boolean(leagueId) && currentWeek >= 1,
    staleTime: CACHE_TTL.MEDIUM,
    gcTime: CACHE_TTL.LONG,
    queryFn: async () => {
      try {
        return await fetchSleeperProjections(currentWeek, season);
      } catch (error) {
        logger.warn('Failed to fetch Sleeper projections:', error);
        return null;
      }
    },
  });

  const historicalDataQuery = useQuery<HistoricalMatchup[], Error>({
    queryKey: ['historical-projections-matchups', leagueId, currentWeek],
    enabled: Boolean(leagueId) && currentWeek >= 2,
    staleTime: CACHE_TTL.MEDIUM,
    gcTime: CACHE_TTL.LONG,
    queryFn: async () => {
      const weeksToFetch = Math.min(6, currentWeek - 1);
      const historicalPromises: Promise<HistoricalMatchup[]>[] = [];

      for (let i = 1; i <= weeksToFetch; i++) {
        const week = currentWeek - i;
        const promise = cachedFetch<Matchup[]>(
          `https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`,
          {},
          CACHE_TTL.MEDIUM
        ).then((data) => (data || []).map((matchup) => ({ ...matchup, week })));

        historicalPromises.push(promise);
      }

      const historicalResults = await Promise.all(historicalPromises);
      return historicalResults.flat();
    },
  });

  const sleeperProjections = sleeperProjectionsQuery.data ?? null;
  const historicalData = historicalDataQuery.data ?? [];

  const generateWeek1Projections = useMemo(() => {
    if (!rosters || !players) return {};

    const projectionMap: WeeklyProjections = {};

    rosters.forEach((roster) => {
      const starters = roster.starters || [];
      let totalProjection = 0;
      let starterCount = 0;

      starters.forEach((playerId: string) => {
        if (!playerId || playerId === '0') return;

        const player = players[playerId];
        if (!player) return;

        const position = player.position as keyof typeof POSITION_BASELINES;
        const baseline = POSITION_BASELINES[position] || POSITION_BASELINES.RB;
        const variance = baseline.base * 0.2;
        const projection = baseline.base + (Math.random() - 0.5) * variance;

        totalProjection += Math.max(0, projection);
        starterCount++;
      });

      const emptySlots = Math.max(0, 9 - starterCount);
      totalProjection += emptySlots * 8;

      const currentMatchup = currentMatchups?.find((m) => m.roster_id === roster.roster_id);
      const gameStatus = getGameStatus(currentMatchup?.points || 0);

      let confidence = 0.6;
      if (gameStatus === 'not-played') confidence = 0.4;
      if (gameStatus === 'in-progress') confidence = 0.5;

      projectionMap[roster.roster_id] = {
        rosterId: roster.roster_id,
        projectedPoints: Math.round(totalProjection * 10) / 10,
        confidence,
        historicalAverage: totalProjection,
        trendAdjustment: 0,
        opponentAdjustment: 0,
        projectionType: 'draft-based',
        gameStatus,
        source: 'draft',
      };
    });

    return projectionMap;
  }, [rosters, players, currentMatchups]);

  const historicalProjections = useMemo(() => {
    if (historicalData.length === 0) return {};

    const projectionMap: WeeklyProjections = {};
    const rosterData: Record<number, HistoricalMatchup[]> = {};

    historicalData.forEach((matchup) => {
      if (!rosterData[matchup.roster_id]) {
        rosterData[matchup.roster_id] = [];
      }
      rosterData[matchup.roster_id].push(matchup);
    });

    const allPoints = historicalData.map((m) => m.points);
    const leagueAverage = allPoints.reduce((sum, points) => sum + points, 0) / allPoints.length;

    Object.entries(rosterData).forEach(([rosterIdStr, matchups]) => {
      const rosterId = Number.parseInt(rosterIdStr, 10);
      if (matchups.length === 0) return;

      const sortedMatchups = [...matchups].sort((a, b) => b.week - a.week);
      const totalPoints = sortedMatchups.reduce((sum, m) => sum + m.points, 0);
      const historicalAverage = totalPoints / sortedMatchups.length;

      let trendAdjustment = 0;
      if (sortedMatchups.length >= 3) {
        const recentGames = sortedMatchups.slice(0, 3);
        const recentAverage = recentGames.reduce((sum, m) => sum + m.points, 0) / recentGames.length;
        trendAdjustment = (recentAverage - historicalAverage) * 0.3;
      }

      const opponentAdjustment = (leagueAverage - historicalAverage) * 0.1;
      const projectedPoints = Math.max(0, historicalAverage + trendAdjustment + opponentAdjustment);

      const dataPoints = sortedMatchups.length;
      const variance =
        sortedMatchups.reduce((sum, m) => sum + Math.pow(m.points - historicalAverage, 2), 0) /
        dataPoints;
      const standardDeviation = Math.sqrt(variance);
      const consistencyDenominator = historicalAverage || 1;
      const consistency = Math.max(0, 1 - standardDeviation / consistencyDenominator);
      const dataConfidence = Math.min(1, dataPoints / 6);
      let confidence = consistency * 0.7 + dataConfidence * 0.3;

      const currentMatchup = currentMatchups?.find((m) => m.roster_id === rosterId);
      const gameStatus = getGameStatus(currentMatchup?.points || 0);
      if (gameStatus === 'not-played') confidence = Math.min(confidence, 0.6);
      if (gameStatus === 'in-progress') confidence *= 0.8;

      projectionMap[rosterId] = {
        rosterId,
        projectedPoints: Math.round(projectedPoints * 10) / 10,
        confidence: Math.round(confidence * 100) / 100,
        historicalAverage: Math.round(historicalAverage * 10) / 10,
        trendAdjustment: Math.round(trendAdjustment * 10) / 10,
        opponentAdjustment: Math.round(opponentAdjustment * 10) / 10,
        projectionType: 'historical',
        gameStatus,
        source: 'historical',
      };
    });

    return projectionMap;
  }, [historicalData, currentMatchups]);

  const sleeperProjectionData = useMemo(() => {
    if (!sleeperProjections || !rosters) return {};

    const projectionMap: WeeklyProjections = {};

    rosters.forEach((roster) => {
      const starters = roster.starters || [];
      let totalProjection = 0;
      let projectedPlayers = 0;

      starters.forEach((playerId: string) => {
        if (!playerId || playerId === '0') return;
        const playerProjection = sleeperProjections[playerId];
        if (playerProjection && typeof playerProjection.pts_ppr === 'number') {
          totalProjection += playerProjection.pts_ppr;
          projectedPlayers++;
        }
      });

      if (projectedPlayers === 0) return;

      const currentMatchup = currentMatchups?.find((m) => m.roster_id === roster.roster_id);
      const gameStatus = getGameStatus(currentMatchup?.points || 0);
      let confidence = 0.85;
      if (gameStatus === 'not-played') confidence = 0.75;
      if (gameStatus === 'in-progress') confidence = 0.9;

      projectionMap[roster.roster_id] = {
        rosterId: roster.roster_id,
        projectedPoints: Math.round(totalProjection * 10) / 10,
        confidence,
        projectionType: 'sleeper',
        gameStatus,
        source: 'sleeper',
      };
    });

    return projectionMap;
  }, [sleeperProjections, rosters, currentMatchups]);

  const projections = useMemo(() => {
    if (Object.keys(sleeperProjectionData).length > 0) return sleeperProjectionData;
    if (currentWeek >= 2 && Object.keys(historicalProjections).length > 0) return historicalProjections;
    return generateWeek1Projections;
  }, [sleeperProjectionData, historicalProjections, generateWeek1Projections, currentWeek]);

  return {
    projections,
    loading:
      sleeperProjectionsQuery.isLoading ||
      sleeperProjectionsQuery.isFetching ||
      historicalDataQuery.isLoading ||
      historicalDataQuery.isFetching,
    error:
      historicalDataQuery.error?.message ??
      sleeperProjectionsQuery.error?.message ??
      null,
    dataPoints: historicalData.length,
    sleeperProjectionsAvailable: Object.keys(sleeperProjectionData).length > 0,
  };
};

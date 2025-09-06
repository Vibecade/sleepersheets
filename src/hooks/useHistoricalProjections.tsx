import { useState, useEffect, useMemo } from 'react';
import { useMatchups, type Matchup } from './useMatchups';
import { cachedFetch } from '@/utils/apiCache';
import { useLeagueData } from '@/components/LeagueDataProvider';

export interface ProjectionData {
  rosterId: number;
  projectedPoints: number;
  confidence: number; // 0-1 scale
  historicalAverage: number;
  trendAdjustment: number;
  opponentAdjustment: number;
  projectionType: 'historical' | 'draft-based';
}

export interface WeeklyProjections {
  [rosterId: number]: ProjectionData;
}

interface HistoricalMatchup extends Matchup {
  week: number;
}

// Week 1 projection baselines by position
const POSITION_BASELINES = {
  QB: { base: 20, variance: 5 },
  RB: { base: 12, variance: 8 },
  WR: { base: 10, variance: 6 },
  TE: { base: 8, variance: 4 },
  K: { base: 8, variance: 3 },
  DEF: { base: 8, variance: 4 }
} as const;

export const useHistoricalProjections = (leagueId: string, currentWeek: number) => {
  const { rosters, draftPicks, players } = useLeagueData();
  const [historicalData, setHistoricalData] = useState<HistoricalMatchup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate week 1 projections based on draft data
  const generateWeek1Projections = useMemo(() => {
    if (!rosters || !players) return {};

    const projectionMap: WeeklyProjections = {};

    rosters.forEach(roster => {
      const starters = roster.starters || [];
      let totalProjection = 0;
      let starterCount = 0;

      // Calculate projection based on starter positions
      starters.forEach((playerId: string) => {
        if (!playerId || playerId === '0') return;
        
        const player = players[playerId];
        if (!player) return;

        const position = player.position as keyof typeof POSITION_BASELINES;
        const baseline = POSITION_BASELINES[position] || POSITION_BASELINES.RB;
        
        // Add some randomness for week 1 (-20% to +20% of base)
        const variance = baseline.base * 0.2;
        const projection = baseline.base + (Math.random() - 0.5) * variance;
        
        totalProjection += Math.max(0, projection);
        starterCount++;
      });

      // Fill empty starter slots with average baseline
      const averageBaseline = 8;
      const emptySlots = Math.max(0, 9 - starterCount); // Assume 9 starters
      totalProjection += emptySlots * averageBaseline;

      projectionMap[roster.roster_id] = {
        rosterId: roster.roster_id,
        projectedPoints: Math.round(totalProjection * 10) / 10,
        confidence: 0.6, // Lower confidence for draft-based
        historicalAverage: totalProjection,
        trendAdjustment: 0,
        opponentAdjustment: 0,
        projectionType: 'draft-based'
      };
    });

    return projectionMap;
  }, [rosters, players]);

  // Fetch historical matchup data for weeks 2+
  useEffect(() => {
    const fetchHistoricalData = async () => {
      if (!leagueId || currentWeek < 2) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const weeksToFetch = Math.min(6, currentWeek - 1); // Last 6 weeks or available weeks
        const historicalPromises: Promise<HistoricalMatchup[]>[] = [];

        for (let i = 1; i <= weeksToFetch; i++) {
          const week = currentWeek - i;
          const promise = cachedFetch<Matchup[]>(
            `https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`,
            {},
            5 * 60 * 1000 // 5 minutes cache
          ).then(data => (data || []).map(matchup => ({ ...matchup, week })));
          
          historicalPromises.push(promise);
        }

        const historicalResults = await Promise.all(historicalPromises);
        const flattenedData = historicalResults.flat();
        
        setHistoricalData(flattenedData);
      } catch (err) {
        console.error('Error fetching historical data:', err);
        setError('Failed to fetch historical data');
      } finally {
        setLoading(false);
      }
    };

    fetchHistoricalData();
  }, [leagueId, currentWeek]);

  // Calculate projections based on historical data
  const historicalProjections = useMemo(() => {
    if (historicalData.length === 0) return {};

    const projectionMap: WeeklyProjections = {};
    
    // Group data by roster_id
    const rosterData: Record<number, HistoricalMatchup[]> = {};
    historicalData.forEach(matchup => {
      if (!rosterData[matchup.roster_id]) {
        rosterData[matchup.roster_id] = [];
      }
      rosterData[matchup.roster_id].push(matchup);
    });

    // Calculate league-wide scoring average for opponent adjustments
    const allPoints = historicalData.map(m => m.points);
    const leagueAverage = allPoints.reduce((sum, points) => sum + points, 0) / allPoints.length;

    Object.entries(rosterData).forEach(([rosterIdStr, matchups]) => {
      const rosterId = parseInt(rosterIdStr);
      if (matchups.length === 0) return;

      // Sort by week (most recent first)
      const sortedMatchups = matchups.sort((a, b) => b.week - a.week);
      
      // Calculate basic historical average
      const totalPoints = sortedMatchups.reduce((sum, m) => sum + m.points, 0);
      const historicalAverage = totalPoints / sortedMatchups.length;

      // Calculate trend adjustment (recent 3 weeks weighted more heavily)
      let trendAdjustment = 0;
      if (sortedMatchups.length >= 3) {
        const recentGames = sortedMatchups.slice(0, 3);
        const recentAverage = recentGames.reduce((sum, m) => sum + m.points, 0) / recentGames.length;
        trendAdjustment = (recentAverage - historicalAverage) * 0.3; // 30% weight to trend
      }

      // Calculate opponent strength adjustment
      // For now, use league average as baseline (could be enhanced with specific opponent data)
      const opponentAdjustment = (leagueAverage - historicalAverage) * 0.1; // 10% weight to opponent

      // Final projection
      const projectedPoints = Math.max(0, historicalAverage + trendAdjustment + opponentAdjustment);

      // Calculate confidence based on data availability and consistency
      const dataPoints = sortedMatchups.length;
      const variance = sortedMatchups.reduce((sum, m) => sum + Math.pow(m.points - historicalAverage, 2), 0) / dataPoints;
      const standardDeviation = Math.sqrt(variance);
      const consistency = Math.max(0, 1 - (standardDeviation / historicalAverage));
      const dataConfidence = Math.min(1, dataPoints / 6); // More confident with more data
      const confidence = (consistency * 0.7) + (dataConfidence * 0.3);

      projectionMap[rosterId] = {
        rosterId,
        projectedPoints: Math.round(projectedPoints * 10) / 10, // Round to 1 decimal
        confidence: Math.round(confidence * 100) / 100, // Round to 2 decimals
        historicalAverage: Math.round(historicalAverage * 10) / 10,
        trendAdjustment: Math.round(trendAdjustment * 10) / 10,
        opponentAdjustment: Math.round(opponentAdjustment * 10) / 10,
        projectionType: 'historical'
      };
    });

    return projectionMap;
  }, [historicalData]);

  // Return appropriate projections based on current week
  const projections = currentWeek === 1 ? generateWeek1Projections : historicalProjections;

  return {
    projections,
    loading,
    error,
    dataPoints: historicalData.length
  };
};
import { useState, useEffect, useMemo } from 'react';
import { useMatchups, type Matchup } from './useMatchups';
import { cachedFetch } from '@/utils/apiCache';

export interface ProjectionData {
  rosterId: number;
  projectedPoints: number;
  confidence: number; // 0-1 scale
  historicalAverage: number;
  trendAdjustment: number;
  opponentAdjustment: number;
}

export interface WeeklyProjections {
  [rosterId: number]: ProjectionData;
}

interface HistoricalMatchup extends Matchup {
  week: number;
}

export const useHistoricalProjections = (leagueId: string, currentWeek: number) => {
  const [historicalData, setHistoricalData] = useState<HistoricalMatchup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch historical matchup data for the last 6 weeks
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
  const projections = useMemo(() => {
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
      };
    });

    return projectionMap;
  }, [historicalData]);

  return {
    projections,
    loading,
    error,
    dataPoints: historicalData.length
  };
};
import { useState, useEffect, useMemo } from 'react';
import { useMatchups, type Matchup } from './useMatchups';
import { cachedFetch } from '@/utils/apiCache';
import { useLeagueData } from '@/components/LeagueDataProvider';
import { fetchSleeperProjections, type SleeperProjection } from '@/utils/leagueApi';

export interface ProjectionData {
  rosterId: number;
  projectedPoints: number;
  confidence: number; // 0-1 scale
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

// Week 1 projection baselines by position
const POSITION_BASELINES = {
  QB: { base: 20, variance: 5 },
  RB: { base: 12, variance: 8 },
  WR: { base: 10, variance: 6 },
  TE: { base: 8, variance: 4 },
  K: { base: 8, variance: 3 },
  DEF: { base: 8, variance: 4 }
} as const;

// Helper function to determine game status
const getGameStatus = (currentPoints: number, currentWeek: number): 'not-played' | 'in-progress' | 'completed' | 'poor-performance' => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const hour = now.getHours();
  
  // Thursday games start around 8:20 PM ET (20:20)
  // Sunday games start around 1:00 PM ET (13:00)
  // Monday games start around 8:15 PM ET (20:15)
  
  if (currentPoints === 0) {
    // Thursday before 8 PM or early in week
    if (dayOfWeek < 4 || (dayOfWeek === 4 && hour < 20)) {
      return 'not-played';
    }
    // Thursday night games have started, but this team has 0 points
    if (dayOfWeek === 4 && hour >= 20) {
      return 'poor-performance'; // Likely their players didn't play Thursday
    }
    // Friday/Saturday - wait for Sunday
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      return 'not-played';
    }
    // Sunday before 1 PM
    if (dayOfWeek === 0 && hour < 13) {
      return 'not-played';
    }
    // Sunday afternoon/evening or Monday before games
    if (dayOfWeek === 0 || (dayOfWeek === 1 && hour < 20)) {
      return 'poor-performance'; // Games have started, 0 points is concerning
    }
    // Monday night - if still 0, definitely poor performance
    if (dayOfWeek === 1 && hour >= 20) {
      return 'poor-performance';
    }
    // Tuesday/Wednesday - week is over
    return 'poor-performance';
  }
  
  // Has some points
  if (currentPoints > 0 && currentPoints < 50) {
    // Check if we're still in the middle of the week
    if (dayOfWeek === 0 || (dayOfWeek === 1 && hour < 23)) {
      return 'in-progress';
    }
  }
  
  return 'completed';
};

export const useHistoricalProjections = (leagueId: string, currentWeek: number, currentMatchups?: Matchup[]) => {
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

      // Determine game status for week 1 confidence adjustment
      const currentMatchup = currentMatchups?.find(m => m.roster_id === roster.roster_id);
      const currentPoints = currentMatchup?.points || 0;
      const gameStatus = getGameStatus(currentPoints, currentWeek);
      
      // Adjust confidence based on game status
      let adjustedConfidence = 0.6; // Base confidence for draft-based
      if (gameStatus === 'not-played') {
        adjustedConfidence = 0.4; // Lower confidence when games haven't started
      } else if (gameStatus === 'in-progress') {
        adjustedConfidence = 0.5; // Moderate confidence during games
      }

      projectionMap[roster.roster_id] = {
        rosterId: roster.roster_id,
        projectedPoints: Math.round(totalProjection * 10) / 10,
        confidence: adjustedConfidence,
        historicalAverage: totalProjection,
        trendAdjustment: 0,
        opponentAdjustment: 0,
        projectionType: 'draft-based',
        gameStatus,
        source: 'draft'
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
      let baseConfidence = (consistency * 0.7) + (dataConfidence * 0.3);
      
      // Adjust confidence based on current week game status
      const currentMatchup = currentMatchups?.find(m => m.roster_id === rosterId);
      const currentPoints = currentMatchup?.points || 0;
      const gameStatus = getGameStatus(currentPoints, currentWeek);
      
      let adjustedConfidence = baseConfidence;
      if (gameStatus === 'not-played') {
        adjustedConfidence = Math.min(baseConfidence, 0.6); // Cap confidence when games haven't started
      } else if (gameStatus === 'in-progress') {
        adjustedConfidence = baseConfidence * 0.8; // Slightly lower during games
      }
      
      const confidence = adjustedConfidence;

      projectionMap[rosterId] = {
        rosterId,
        projectedPoints: Math.round(projectedPoints * 10) / 10, // Round to 1 decimal
        confidence: Math.round(confidence * 100) / 100, // Round to 2 decimals
        historicalAverage: Math.round(historicalAverage * 10) / 10,
        trendAdjustment: Math.round(trendAdjustment * 10) / 10,
        opponentAdjustment: Math.round(opponentAdjustment * 10) / 10,
        projectionType: 'historical',
        gameStatus: gameStatus,
        source: 'historical'
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
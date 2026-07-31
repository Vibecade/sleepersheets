import { logger } from '@/utils/logger';


export interface TeamSalaryData {
  teamSalaries: Record<number, number>;
  teamDeadCaps: Record<number, number>;
  totalSalaries: Record<number, number>;
  capStatus: Record<number, { percentage: number; status: 'over' | 'near' | 'under' }>;
}

interface CalculateOptimizedSalariesProps {
  rosters: any[];
  deadCapPlayers: any[];
  getSalaryCapContribution: (playerId: string) => number;
  salaryCap: number;
}

export const calculateOptimizedSalaries = ({
  rosters,
  deadCapPlayers,
  getSalaryCapContribution,
  salaryCap
}: CalculateOptimizedSalariesProps): TeamSalaryData => {
  logger.debug('🧮 Recalculating optimized salary data for', rosters.length, 'teams');
  logger.debug('💰 Salary Cap:', salaryCap);

  const teamSalaries: Record<number, number> = {};
  const teamDeadCaps: Record<number, number> = {};
  const totalSalaries: Record<number, number> = {};
  const capStatus: Record<number, { percentage: number; status: 'over' | 'near' | 'under' }> = {};
  
  // Pre-calculate dead caps for efficiency O(deadCapPlayers.length)
  const deadCapsByRoster: Record<number, number> = {};
  deadCapPlayers.forEach(player => {
    const rosterId = player.roster_id;
    if (deadCapsByRoster[rosterId] === undefined) {
      deadCapsByRoster[rosterId] = 0;
    }
    deadCapsByRoster[rosterId] += Math.max(1, Math.round((player.salary || 0) * 0.25));
  });

  // Calculate everything in one loop over rosters O(rosters.length)
  rosters.forEach((roster) => {
    const rosterId = roster.roster_id;

    // Calculate active salaries for each team (exclude IR/reserve players)
    const allPlayerIds = [
      ...(roster.players || []),
      ...(roster.taxi || [])
    ];
    
    const activeSalary = allPlayerIds.reduce((total, playerId) => {
      const contribution = getSalaryCapContribution(playerId);
      return total + contribution;
    }, 0);

    logger.debug(`Team ${rosterId}: ${allPlayerIds.length} players, Active Salary: $${activeSalary}`);
    teamSalaries[rosterId] = activeSalary;
    
    // Get pre-calculated dead cap
    const deadCap = deadCapsByRoster[rosterId] || 0;
    teamDeadCaps[rosterId] = deadCap;

    // Total cap commitment = active salary + dead cap.
    const total = activeSalary + deadCap;
    totalSalaries[rosterId] = total;

    logger.debug(`Team ${rosterId} Total: $${total} (Active: $${activeSalary} + Dead Cap: $${deadCap})`);

    // Dead cap counts against the cap — it's money already committed to
    // players no longer on the roster, which is the whole point of a dead
    // cap penalty. This previously divided by activeSalary only, so a team
    // pushed over the cap by dead money still reported "under", and the
    // trade simulator showed a dollar total and a percentage that
    // disagreed. CommissionerOverview already computed it this way; this
    // brings the two implementations in line.
    const percentage = (total / salaryCap) * 100;
    let status: 'over' | 'near' | 'under' = 'under';

    if (percentage > 100) status = 'over';
    else if (percentage > 90) status = 'near';

    logger.debug(`Team ${rosterId} Cap Status: ${percentage.toFixed(1)}% (${status})`);

    capStatus[rosterId] = { percentage, status };
  });
  
  return {
    teamSalaries,
    teamDeadCaps,
    totalSalaries,
    capStatus
  };
};

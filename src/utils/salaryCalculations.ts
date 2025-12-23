
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
  console.log('🧮 Recalculating optimized salary data for', rosters.length, 'teams');
  console.log('💰 Salary Cap:', salaryCap);

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

    console.log(`Team ${rosterId}: ${allPlayerIds.length} players, Active Salary: $${activeSalary}`);
    teamSalaries[rosterId] = activeSalary;
    
    // Get pre-calculated dead cap
    const deadCap = deadCapsByRoster[rosterId] || 0;
    teamDeadCaps[rosterId] = deadCap;

    // Calculate totals (dead cap doesn't count toward salary cap)
    const total = activeSalary + deadCap;
    totalSalaries[rosterId] = total;

    console.log(`Team ${rosterId} Total: $${total} (Active: $${activeSalary} + Dead Cap: $${deadCap})`);

    // Cap percentage based only on active salary (dead cap excluded)
    const percentage = (activeSalary / salaryCap) * 100;
    let status: 'over' | 'near' | 'under' = 'under';

    if (percentage > 100) status = 'over';
    else if (percentage > 90) status = 'near';

    console.log(`Team ${rosterId} Cap Status: ${percentage.toFixed(1)}% (${status})`);

    capStatus[rosterId] = { percentage, status };
  });
  
  return {
    teamSalaries,
    teamDeadCaps,
    totalSalaries,
    capStatus
  };
};

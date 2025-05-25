
import { useMemo } from 'react';

interface OptimizedSalaryCalculationsProps {
  rosters: any[];
  salaries: Record<string, number | null>;
  deadCapPlayers: any[];
}

interface TeamSalaryData {
  teamSalaries: Record<number, number>;
  teamDeadCaps: Record<number, number>;
  totalSalaries: Record<number, number>;
  capStatus: Record<number, { percentage: number; status: 'over' | 'near' | 'under' }>;
}

export const useOptimizedSalaryCalculations = ({ 
  rosters, 
  salaries, 
  deadCapPlayers 
}: OptimizedSalaryCalculationsProps, salaryCap: number = 200000): TeamSalaryData => {
  return useMemo(() => {
    console.log('Recalculating salary data for', rosters.length, 'teams');
    
    const teamSalaries: Record<number, number> = {};
    const teamDeadCaps: Record<number, number> = {};
    const totalSalaries: Record<number, number> = {};
    const capStatus: Record<number, { percentage: number; status: 'over' | 'near' | 'under' }> = {};
    
    // Calculate active salaries for each team
    rosters.forEach((roster) => {
      const allPlayerIds = [
        ...(roster.players || []),
        ...(roster.taxi || []),
        ...(roster.reserve || [])
      ];
      
      teamSalaries[roster.roster_id] = allPlayerIds.reduce((total, playerId) => {
        const salary = salaries[playerId];
        return total + (salary || 0);
      }, 0);
    });
    
    // Calculate dead cap for each team
    rosters.forEach((roster) => {
      teamDeadCaps[roster.roster_id] = deadCapPlayers
        .filter(player => player.roster_id === roster.roster_id)
        .reduce((total, player) => total + (player.salary || 0), 0);
    });
    
    // Calculate totals and cap status
    rosters.forEach((roster) => {
      const activeSalary = teamSalaries[roster.roster_id] || 0;
      const deadCap = teamDeadCaps[roster.roster_id] || 0;
      const total = activeSalary + deadCap;
      
      totalSalaries[roster.roster_id] = total;
      
      const percentage = (total / salaryCap) * 100;
      let status: 'over' | 'near' | 'under' = 'under';
      
      if (percentage > 100) status = 'over';
      else if (percentage > 90) status = 'near';
      
      capStatus[roster.roster_id] = { percentage, status };
    });
    
    return {
      teamSalaries,
      teamDeadCaps,
      totalSalaries,
      capStatus
    };
  }, [rosters, salaries, deadCapPlayers, salaryCap]);
};


import { useMemo } from 'react';

interface SalaryCalculationsProps {
  rosters: any[];
  salaries: Record<string, number | null>;
  deadCapPlayers: any[];
  getEffectiveSalary: (playerId: string) => number;
}

export const useSalaryCalculations = ({ rosters, salaries, deadCapPlayers, getEffectiveSalary }: SalaryCalculationsProps) => {
  const teamSalaries = useMemo(() => {
    console.log('Calculating team salaries for', rosters.length, 'teams');
    const calculations: Record<number, number> = {};
    
    rosters.forEach((roster) => {
      const allPlayerIds = [
        ...(roster.players || []),
        ...(roster.taxi || []),
        ...(roster.reserve || [])
      ];
      
      calculations[roster.roster_id] = allPlayerIds.reduce((total, playerId) => {
        const effectiveSalary = getEffectiveSalary(playerId);
        return total + effectiveSalary;
      }, 0);
    });
    
    return calculations;
  }, [rosters, salaries, getEffectiveSalary]);

  const teamDeadCaps = useMemo(() => {
    console.log('Calculating team dead caps for', rosters.length, 'teams');
    const calculations: Record<number, number> = {};
    
    rosters.forEach((roster) => {
      calculations[roster.roster_id] = deadCapPlayers
        .filter(player => player.roster_id === roster.roster_id)
        .reduce((total, player) => total + Math.max(1, Math.round((player.salary || 0) * 0.25)), 0);
    });
    
    return calculations;
  }, [rosters, deadCapPlayers]);

  return { teamSalaries, teamDeadCaps };
};

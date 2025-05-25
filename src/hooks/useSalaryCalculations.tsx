
import { useMemo } from 'react';

interface SalaryCalculationsProps {
  rosters: any[];
  salaries: Record<string, number | null>;
  deadCapPlayers: any[];
}

export const useSalaryCalculations = ({ rosters, salaries, deadCapPlayers }: SalaryCalculationsProps) => {
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
        const salary = salaries[playerId];
        return total + (salary || 0);
      }, 0);
    });
    
    return calculations;
  }, [rosters, salaries]);

  const teamDeadCaps = useMemo(() => {
    console.log('Calculating team dead caps for', rosters.length, 'teams');
    const calculations: Record<number, number> = {};
    
    rosters.forEach((roster) => {
      calculations[roster.roster_id] = deadCapPlayers
        .filter(player => player.roster_id === roster.roster_id)
        .reduce((total, player) => total + (player.salary || 0), 0);
    });
    
    return calculations;
  }, [rosters, deadCapPlayers]);

  return { teamSalaries, teamDeadCaps };
};

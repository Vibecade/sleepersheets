import { useMemo } from 'react';
import { usePlayerContracts } from './usePlayerContracts';
import { usePlayerSalaries } from './usePlayerSalaries';
import { useLeagueSettings } from './useLeagueSettings';

interface FAABCalculationsProps {
  rosters: any[];
  leagueId: string;
}

export const useFAABCalculations = ({ rosters, leagueId }: FAABCalculationsProps) => {
  const { salaries } = usePlayerSalaries(leagueId);
  const { settings } = useLeagueSettings(leagueId);
  const { contracts } = usePlayerContracts(leagueId);

  const teamFAAB = useMemo(() => {
    console.log('Calculating FAAB for teams');
    const calculations: Record<number, number> = {};
    const salaryCap = settings?.salary_cap || 200000;
    const reserveLimit = 100; // Fixed reserve limit as specified
    
    rosters.forEach((roster) => {
      const allPlayerIds = [
        ...(roster.players || []),
        ...(roster.taxi || []),
        ...(roster.reserve || [])
      ];
      
      const totalSalary = allPlayerIds.reduce((total, playerId) => {
        const salary = salaries[playerId];
        return total + (salary || 0);
      }, 0);
      
      // FAAB = Salary Cap - Total Salary - Reserve Limit
      const faab = Math.max(0, salaryCap - totalSalary - reserveLimit);
      calculations[roster.roster_id] = Math.min(faab, 100); // Never exceed 100
    });
    
    return calculations;
  }, [rosters, salaries, settings?.salary_cap]);

  const calculateDeadCap = useMemo(() => {
    return (playerId: string, currentYear: number = new Date().getFullYear()) => {
      const contractLength = contracts[playerId];
      if (!contractLength || contractLength <= 0) return 0;
      
      const salary = salaries[playerId] || 0;
      if (salary === 0) return 0;
      
      // Dead cap = 25% of salary for remaining years
      // If dropped in last year, 25% applies this year only
      const deadCapPercentage = 0.25;
      const yearsRemaining = Math.max(1, contractLength); // At least 1 year if they have a contract
      
      return salary * deadCapPercentage;
    };
  }, [contracts, salaries]);

  const calculateTotalDeadCapForPlayer = useMemo(() => {
    return (playerId: string, currentYear: number = new Date().getFullYear()) => {
      const contractLength = contracts[playerId];
      if (!contractLength || contractLength <= 0) return { currentYear: 0, nextYear: 0 };
      
      const salary = salaries[playerId] || 0;
      if (salary === 0) return { currentYear: 0, nextYear: 0 };
      
      const deadCapPercentage = 0.25;
      const deadCapAmount = salary * deadCapPercentage;
      
      // If in last year of contract, only current year penalty
      if (contractLength === 1) {
        return { currentYear: deadCapAmount, nextYear: 0 };
      }
      
      // Otherwise, penalty applies to current and next year
      return { currentYear: deadCapAmount, nextYear: deadCapAmount };
    };
  }, [contracts, salaries]);

  return {
    teamFAAB,
    calculateDeadCap,
    calculateTotalDeadCapForPlayer
  };
};

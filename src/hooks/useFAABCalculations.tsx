
import { useMemo } from 'react';
import { usePlayerContracts } from './usePlayerContracts';
import { usePlayerSalaries } from './usePlayerSalaries';
import { useDeadCapPlayers } from './useDeadCapPlayers';
import { useLeagueSettings } from './useLeagueSettings';

interface FAABCalculationsProps {
  rosters: any[];
  leagueId: string;
}

export const useFAABCalculations = ({ rosters, leagueId }: FAABCalculationsProps) => {
  const { salaries, getEffectiveSalary } = usePlayerSalaries(leagueId);
  const { settings } = useLeagueSettings(leagueId);
  const { deadCapPlayers } = useDeadCapPlayers(leagueId);
  const { contracts } = usePlayerContracts(leagueId);

  const teamFAAB = useMemo(() => {
    console.log('Calculating FAAB for teams');
    const calculations: Record<number, number> = {};
    const salaryCap = settings?.salary_cap || 200000;
    const faabCap = settings?.faab_cap || 100;
    
    rosters.forEach((roster) => {
      const allPlayerIds = [
        ...(roster.players || []),
        ...(roster.taxi || []),
        ...(roster.reserve || [])
      ];
      
      const totalSalary = allPlayerIds.reduce((total, playerId) => {
        const effectiveSalary = getEffectiveSalary(playerId);
        return total + effectiveSalary;
      }, 0);
      
      // Add dead cap to total salary
      const deadCap = deadCapPlayers
        .filter(player => player.roster_id === roster.roster_id)
        .reduce((total, player) => total + Math.max(1, Math.round((player.salary || 0) * 0.25)), 0);
      
      const totalWithDeadCap = totalSalary + deadCap;
      
      // FAAB = min(Salary Cap - Total Salary, FAAB Cap)
      const availableFaab = Math.max(0, salaryCap - totalWithDeadCap);
      const faab = Math.min(availableFaab, faabCap);
      calculations[roster.roster_id] = faab;
    });
    
    return calculations;
  }, [rosters, salaries, deadCapPlayers, settings?.salary_cap, settings?.faab_cap, getEffectiveSalary]);

  const calculateDeadCap = useMemo(() => {
    return (playerId: string, currentYear: number = new Date().getFullYear()) => {
      const contractLength = contracts[playerId];
      if (!contractLength || contractLength <= 0) return 0;
      
      const effectiveSalary = getEffectiveSalary(playerId);
      if (effectiveSalary === 0) return 0;
      
      // Dead cap = 25% of effective salary for remaining years
      // If dropped in last year, 25% applies this year only
      const deadCapPercentage = 0.25;
      const deadCapAmount = effectiveSalary * deadCapPercentage;
      
      return Math.max(1, Math.round(deadCapAmount));
    };
  }, [contracts, getEffectiveSalary]);

  const calculateTotalDeadCapForPlayer = useMemo(() => {
    return (playerId: string, currentYear: number = new Date().getFullYear()) => {
      const contractLength = contracts[playerId];
      if (!contractLength || contractLength <= 0) return { currentYear: 0, nextYear: 0 };
      
      const effectiveSalary = getEffectiveSalary(playerId);
      if (effectiveSalary === 0) return { currentYear: 0, nextYear: 0 };
      
      const deadCapPercentage = 0.25;
      const deadCapAmount = Math.max(1, Math.round(effectiveSalary * deadCapPercentage));
      
      // If in last year of contract, only current year penalty
      if (contractLength === 1) {
        return { currentYear: deadCapAmount, nextYear: 0 };
      }
      
      // Otherwise, penalty applies to current and next year
      return { currentYear: deadCapAmount, nextYear: deadCapAmount };
    };
  }, [contracts, getEffectiveSalary]);

  return {
    teamFAAB,
    calculateDeadCap,
    calculateTotalDeadCapForPlayer
  };
};

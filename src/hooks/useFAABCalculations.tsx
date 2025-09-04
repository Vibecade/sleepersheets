import { useMemo, useCallback } from 'react';
import { usePlayerContracts } from './usePlayerContracts';
import { usePlayerSalaries } from './usePlayerSalaries';
import { useDeadCapPlayers } from './useDeadCapPlayers';
import { useLeagueSettings } from './useLeagueSettings';

interface FAABCalculationsProps {
  rosters: any[];
  leagueId: string;
  transactions?: any[];
}

export const useFAABCalculations = ({ rosters, leagueId, transactions = [] }: FAABCalculationsProps) => {
  const { salaries, getEffectiveSalary } = usePlayerSalaries(leagueId);
  const { settings } = useLeagueSettings(leagueId);
  const { deadCapPlayers } = useDeadCapPlayers(leagueId);
  const { contracts } = usePlayerContracts(leagueId);

  // Calculate FAAB spent per roster from transactions
  const faabSpentByRoster = useMemo(() => {
    const spentByRoster: Record<number, number> = {};
    
    transactions.forEach(transaction => {
      // Only count FAAB for successful transactions (status: 'complete')
      if (transaction.status !== 'complete') {
        return;
      }

      // Handle waiver bids (settings.waiver_bid) - only if player was actually added
      if (transaction.settings?.waiver_bid && transaction.roster_ids?.length > 0 && transaction.adds) {
        const rosterId = transaction.roster_ids[0];
        
        // Check if any players were actually added to this roster in this transaction
        const playersAddedToRoster = Object.entries(transaction.adds).some(([playerId, addedToRosterId]) => {
          return addedToRosterId === rosterId;
        });
        
        // Only count FAAB if players were successfully added
        if (playersAddedToRoster) {
          spentByRoster[rosterId] = (spentByRoster[rosterId] || 0) + transaction.settings.waiver_bid;
        }
      }
      
      // Handle FAAB transfers (waiver_budget array) - only for successful transactions
      if (transaction.waiver_budget && Array.isArray(transaction.waiver_budget)) {
        transaction.waiver_budget.forEach((transfer: any) => {
          if (transfer.sender) {
            spentByRoster[transfer.sender] = (spentByRoster[transfer.sender] || 0) + transfer.amount;
          }
        });
      }
    });
    
    return spentByRoster;
  }, [transactions]);

  // Get FAAB cost for a specific player from transactions
  const getPlayerFAABCost = useCallback((playerId: string, rosterId: number) => {
    for (const transaction of transactions) {
      // Only consider successful, complete transactions
      if (transaction.status !== 'complete') {
        continue;
      }
      
      if (transaction.adds && transaction.adds[playerId] === rosterId) {
        // Check if this was a waiver pickup with FAAB cost
        if (transaction.settings?.waiver_bid) {
          return transaction.settings.waiver_bid;
        }
      }
    }
    return 0;
  }, [transactions]);

  const teamFAAB = useMemo(() => {
    if (!rosters.length) return {};
    
    console.log('Calculating FAAB for teams with transaction data');
    const calculations: Record<number, { available: number; spent: number; total: number }> = {};
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
      
      // Calculate FAAB spent from transactions
      const faabSpent = faabSpentByRoster[roster.roster_id] || 0;
      
      // Available FAAB = min(Salary Cap - Total Salary, FAAB Cap) - FAAB Spent
      const availableFaabBeforeSpending = Math.max(0, salaryCap - totalWithDeadCap);
      const maxFaab = Math.min(availableFaabBeforeSpending, faabCap);
      const availableFaab = Math.max(0, maxFaab - faabSpent);
      
      calculations[roster.roster_id] = {
        available: availableFaab,
        spent: faabSpent,
        total: maxFaab
      };
    });
    
    return calculations;
  }, [rosters, settings?.salary_cap, settings?.faab_cap, deadCapPlayers, getEffectiveSalary, faabSpentByRoster]);

  const calculateDeadCap = useCallback((playerId: string, currentYear: number = new Date().getFullYear()) => {
    const contractLength = contracts[playerId];
    if (!contractLength || contractLength <= 0) return 0;
    
    const effectiveSalary = getEffectiveSalary(playerId);
    if (effectiveSalary === 0) return 0;
    
    // Dead cap = 25% of effective salary for remaining years
    // If dropped in last year, 25% applies this year only
    const deadCapPercentage = 0.25;
    const deadCapAmount = effectiveSalary * deadCapPercentage;
    
    return Math.max(1, Math.round(deadCapAmount));
  }, [contracts, getEffectiveSalary]);

  const calculateTotalDeadCapForPlayer = useCallback((playerId: string, currentYear: number = new Date().getFullYear()) => {
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
  }, [contracts, getEffectiveSalary]);

  return {
    teamFAAB,
    faabSpentByRoster,
    getPlayerFAABCost,
    calculateDeadCap,
    calculateTotalDeadCapForPlayer
  };
};
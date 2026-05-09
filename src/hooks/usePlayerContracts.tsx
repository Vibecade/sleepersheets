import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface PlayerContract {
  player_id: string;
  contract_length: number | null;
}

// Cache for contracts to prevent repeated calls
const contractsCache = new Map<string, { data: Record<string, number | null>; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const usePlayerContracts = (leagueId: string) => {
  const [contracts, setContracts] = useState<Record<string, number | null>>({});
  const [loading, setLoading] = useState(true);
  const [lastLeagueId, setLastLeagueId] = useState<string>('');
  const { toast } = useToast();

  // Load existing contracts from database
  const loadContracts = useCallback(async (currentLeagueId: string) => {
    if (!currentLeagueId || currentLeagueId === lastLeagueId) {
      setLoading(false);
      return;
    }

    try {
      logger.debug('Loading contracts for league:', currentLeagueId);
      setLoading(true);
      
      // Check cache first
      const cacheKey = currentLeagueId;
      const cached = contractsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        logger.debug('Using cached contracts for:', currentLeagueId);
        setContracts(cached.data);
        setLastLeagueId(currentLeagueId);
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('player_contracts')
        .select('player_id, contract_length')
        .eq('league_id', currentLeagueId);

      if (error) {
        logger.error('Error loading contracts:', error);
        return;
      }

      logger.debug('Loaded contract data:', data);
      const contractMap: Record<string, number | null> = {};
      data?.forEach((item) => {
        contractMap[item.player_id] = item.contract_length;
      });

      logger.debug(`✅ Contracts loaded for league ${currentLeagueId}:`, {
        totalContracts: Object.keys(contractMap).length,
        withContracts: Object.values(contractMap).filter(c => c && c > 0).length,
        sampleContracts: Object.entries(contractMap).slice(0, 3)
      });

      setContracts(contractMap);
      setLastLeagueId(currentLeagueId);

      // Cache the result
      contractsCache.set(cacheKey, { data: contractMap, timestamp: Date.now() });
    } catch (error) {
      logger.error('Error loading contracts:', error);
    } finally {
      setLoading(false);
    }
  }, [lastLeagueId]);

  useEffect(() => {
    if (leagueId && leagueId !== lastLeagueId) {
      loadContracts(leagueId);
    }
  }, [leagueId, loadContracts, lastLeagueId]);

  // Update contract in database
  const updateContract = async (playerId: string, contractLength: number | null) => {
    try {
      // Check if player is FAAB acquisition - prevent contract assignment
      const { data: salaryData } = await supabase
        .from('player_salaries')
        .select('acquisition_type')
        .eq('league_id', leagueId)
        .eq('player_id', playerId)
        .single();

      if (salaryData?.acquisition_type === 'faab') {
        toast({
          title: "Cannot Set Contract",
          description: "FAAB players cannot have contracts. FAAB spending is tracked separately from salary cap.",
          variant: "destructive",
        });
        return false;
      }

      logger.debug('Updating contract for player:', playerId, 'length:', contractLength);
      const { error } = await supabase
        .from('player_contracts')
        .upsert({
          league_id: leagueId,
          player_id: playerId,
          contract_length: contractLength,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'league_id,player_id'
        });

      if (error) {
        logger.error('Error updating contract:', error);
        toast({
          title: "Error",
          description: "Failed to save contract length",
          variant: "destructive"
        });
        return false;
      }

      const updatedContracts = { ...contracts, [playerId]: contractLength };
      setContracts(updatedContracts);
      
      // Update cache
      const cacheKey = leagueId;
      contractsCache.set(cacheKey, { data: updatedContracts, timestamp: Date.now() });
      
      toast({
        title: "Success",
        description: "Contract length saved successfully",
      });
      return true;
    } catch (error) {
      logger.error('Error updating contract:', error);
      toast({
        title: "Error",
        description: "Failed to save contract length",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    contracts,
    updateContract,
    loading
  };
};
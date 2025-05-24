
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PlayerContract {
  player_id: string;
  contract_length: number | null;
}

export const usePlayerContracts = (leagueId: string) => {
  const [contracts, setContracts] = useState<Record<string, number | null>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load existing contracts from database
  useEffect(() => {
    const loadContracts = async () => {
      try {
        console.log('Loading contracts for league:', leagueId);
        const { data, error } = await supabase
          .from('player_contracts')
          .select('player_id, contract_length')
          .eq('league_id', leagueId);

        if (error) {
          console.error('Error loading contracts:', error);
          return;
        }

        console.log('Loaded contract data:', data);
        const contractMap: Record<string, number | null> = {};
        data?.forEach((item) => {
          contractMap[item.player_id] = item.contract_length;
        });
        setContracts(contractMap);
      } catch (error) {
        console.error('Error loading contracts:', error);
      } finally {
        setLoading(false);
      }
    };

    if (leagueId) {
      loadContracts();
    }
  }, [leagueId]);

  // Update contract in database
  const updateContract = async (playerId: string, contractLength: number | null) => {
    try {
      console.log('Updating contract for player:', playerId, 'length:', contractLength);
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
        console.error('Error updating contract:', error);
        toast({
          title: "Error",
          description: "Failed to save contract length",
          variant: "destructive"
        });
        return false;
      }

      setContracts(prev => ({ ...prev, [playerId]: contractLength }));
      toast({
        title: "Success",
        description: "Contract length saved successfully",
      });
      return true;
    } catch (error) {
      console.error('Error updating contract:', error);
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

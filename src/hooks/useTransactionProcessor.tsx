import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logDataAccess } from '@/utils/securityLogger';

interface WaiverUpdate {
  playerId: string;
  salary: number;
  rosterId: number;
}

interface ProcessedTransaction {
  id?: string;
  league_id: string;
  transaction_id: string;
  processed_at?: string;
  player_updates: WaiverUpdate[];
}

export const useTransactionProcessor = () => {
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const isWaiverTransaction = (transaction: any): boolean => {
    return transaction.type === 'waiver' && 
           transaction.status === 'complete' && 
           transaction.settings?.waiver_bid;
  };

  const extractWaiverUpdates = (transaction: any): WaiverUpdate[] => {
    if (!isWaiverTransaction(transaction)) return [];

    const updates: WaiverUpdate[] = [];
    const waiverBid = transaction.settings.waiver_bid;
    const adds = transaction.adds || {};
    
    // waiver_bid is a single number representing the FAAB bid amount
    if (typeof waiverBid === 'number') {
      // Process each added player - the value in adds should be the roster_id
      Object.entries(adds).forEach(([playerId, rosterId]) => {
        if (typeof rosterId === 'number') {
          updates.push({
            playerId,
            salary: waiverBid,
            rosterId: rosterId as number
          });
          console.log(`Extracted waiver update: Player ${playerId}, FAAB: $${waiverBid}, Roster: ${rosterId}`);
        }
      });
    }

    return updates;
  };

  const getProcessedTransactions = async (leagueId: string): Promise<Set<string>> => {
    try {
      logDataAccess(undefined, 'processed_transactions', 'read', true);
      
      const { data, error } = await supabase
        .from('processed_transactions')
        .select('transaction_id')
        .eq('league_id', leagueId);

      if (error) throw error;

      return new Set(data?.map(t => t.transaction_id) || []);
    } catch (error) {
      console.error('Error fetching processed transactions:', error);
      return new Set();
    }
  };

  const markTransactionProcessed = async (
    leagueId: string, 
    transactionId: string, 
    updates: WaiverUpdate[]
  ): Promise<void> => {
    try {
      logDataAccess(undefined, 'processed_transactions', 'write', true);
      
      const { error } = await supabase
        .from('processed_transactions')
        .insert({
          league_id: leagueId,
          transaction_id: transactionId,
          player_updates: updates as any
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error marking transaction as processed:', error);
      throw error;
    }
  };

  const updatePlayerSalary = async (
    leagueId: string, 
    playerId: string, 
    salary: number,
    acquisitionType: 'contract' | 'faab' | 'free_agent' = 'faab'
  ): Promise<boolean> => {
    try {
      logDataAccess(undefined, 'player_salaries', 'write', true);
      
      const { error } = await supabase
        .from('player_salaries')
        .upsert({
          league_id: leagueId,
          player_id: playerId,
          salary: salary,
          acquisition_type: acquisitionType,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating player salary:', error);
      return false;
    }
  };

  const updatePlayerContract = async (
    leagueId: string, 
    playerId: string, 
    contractLength: number = 1
  ): Promise<boolean> => {
    try {
      logDataAccess(undefined, 'player_contracts', 'write', true);
      
      const { error } = await supabase
        .from('player_contracts')
        .upsert({
          league_id: leagueId,
          player_id: playerId,
          contract_length: contractLength,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating player contract:', error);
      return false;
    }
  };

  const processWaiverTransactions = useCallback(async (
    leagueId: string,
    transactions: any[]
  ): Promise<number> => {
    if (!leagueId || !transactions?.length) return 0;

    setProcessing(true);
    let processedCount = 0;

    try {
      // Get already processed transactions
      const processedTransactionIds = await getProcessedTransactions(leagueId);

      // Filter to unprocessed waiver transactions
      const unprocessedWaivers = transactions.filter(transaction => 
        !processedTransactionIds.has(transaction.transaction_id) && 
        isWaiverTransaction(transaction)
      );

      if (unprocessedWaivers.length === 0) {
        return 0;
      }

      console.log(`Processing ${unprocessedWaivers.length} new waiver transactions for league ${leagueId}`);

      // Process each transaction
      for (const transaction of unprocessedWaivers) {
        try {
          const updates = extractWaiverUpdates(transaction);
          
          if (updates.length === 0) continue;

          // Update salaries for FAAB players (no contracts for FAAB acquisitions)
          for (const update of updates) {
            const salarySuccess = await updatePlayerSalary(leagueId, update.playerId, update.salary, 'faab');

            if (salarySuccess) {
              console.log(`Auto-updated FAAB player ${update.playerId}: salary=${update.salary}, acquisition_type=faab (no contract)`);
            }
          }

          // Mark transaction as processed
          await markTransactionProcessed(leagueId, transaction.transaction_id, updates);
          processedCount++;

        } catch (error) {
          console.error(`Error processing transaction ${transaction.transaction_id}:`, error);
        }
      }

      if (processedCount > 0) {
        toast({
          title: "Waiver Updates Applied",
          description: `Auto-updated ${processedCount} waiver transactions with FAAB costs (no contracts for FAAB players).`,
        });
      }

      return processedCount;

    } catch (error) {
      console.error('Error processing waiver transactions:', error);
      toast({
        title: "Processing Error",
        description: "Error auto-updating waiver transactions. Check console for details.",
        variant: "destructive",
      });
      return 0;
    } finally {
      setProcessing(false);
    }
  }, [toast]);

  return {
    processWaiverTransactions,
    processing
  };
};
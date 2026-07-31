import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { useLeagueOwnership } from '@/hooks/useLeagueOwnership';
import { securityLogger } from '@/utils/securityLogger';
import { logger } from '@/utils/logger';

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
  const { user } = useAuth();
  const { canModifyLeague } = useLeagueOwnership();
  const processedOnceRef = useRef<Set<string>>(new Set());

  const isWaiverTransaction = useCallback((transaction: any): boolean => {
    return transaction.type === 'waiver' && 
           transaction.status === 'complete' && 
           transaction.settings?.waiver_bid;
  }, []);

  const extractWaiverUpdates = useCallback((transaction: any): WaiverUpdate[] => {
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
          logger.debug(`Extracted waiver update: Player ${playerId}, FAAB: $${waiverBid}, Roster: ${rosterId}`);
        }
      });
    }

    return updates;
  }, [isWaiverTransaction]);

  const getProcessedTransactions = async (leagueId: string): Promise<Set<string>> => {
    try {
      securityLogger.logDataModification(undefined, 'processed_transactions', 'read', true);
      
      const { data, error } = await supabase
        .from('processed_transactions')
        .select('transaction_id')
        .eq('league_id', leagueId);

      if (error) throw error;

      return new Set(data?.map(t => t.transaction_id) || []);
    } catch (error) {
      logger.error('Error fetching processed transactions:', error);
      return new Set();
    }
  };

  const markTransactionProcessed = async (
    leagueId: string, 
    transactionId: string, 
    updates: WaiverUpdate[]
  ): Promise<void> => {
    try {
      securityLogger.logDataModification(undefined, 'processed_transactions', 'write', true);
      
      const { error } = await supabase
        .from('processed_transactions')
        .insert({
          league_id: leagueId,
          transaction_id: transactionId,
          player_updates: updates as any
        });

      if (error) throw error;
    } catch (error) {
      logger.error('Error marking transaction as processed:', error);
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
      securityLogger.logDataModification(undefined, 'player_salaries', 'write', true);
      
      const { error } = await supabase
        .from('player_salaries')
        .upsert(
          {
            league_id: leagueId,
            player_id: playerId,
            salary: salary,
            acquisition_type: acquisitionType,
            updated_at: new Date().toISOString()
          },
          // Without an explicit conflict target PostgREST inserts a new
          // row rather than updating the existing one, so re-pricing a
          // player would leave duplicate salary rows and whichever came
          // back last would win. Every other player_salaries writer
          // (usePlayerSalaries, ManualContractOverrideDialog) already
          // specifies this; the waiver processor was the odd one out.
          { onConflict: 'league_id,player_id' }
        );

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('Error updating player salary:', error);
      return false;
    }
  };

  const updatePlayerContract = async (
    leagueId: string, 
    playerId: string, 
    contractLength: number = 1
  ): Promise<boolean> => {
    try {
      securityLogger.logDataModification(undefined, 'player_contracts', 'write', true);
      
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
      logger.error('Error updating player contract:', error);
      return false;
    }
  };

  const processWaiverTransactions = useCallback(async (
    leagueId: string,
    transactions: any[]
  ): Promise<number> => {
    if (!leagueId || !transactions?.length) return 0;

    // Check if already processed this league in this session
    if (processedOnceRef.current.has(leagueId)) {
      return 0;
    }

    // Debug authentication status
    logger.debug(`=== TRANSACTION PROCESSOR DEBUG ===`);
    logger.debug(`League ID: ${leagueId}`);
    logger.debug(`User authenticated: ${!!user}`);
    logger.debug(`User ID: ${user?.id}`);
    logger.debug(`Can modify league: ${canModifyLeague(leagueId)}`);
    logger.debug(`Total transactions: ${transactions?.length}`);
    logger.debug(`Waiver transactions: ${transactions?.filter(t => t.type === 'waiver').length}`);
    logger.debug(`Complete waiver transactions: ${transactions?.filter(t => t.type === 'waiver' && t.status === 'complete').length}`);
    
    // Check authentication - only proceed if user is logged in and owns the league
    if (!user || !canModifyLeague(leagueId)) {
      logger.debug(`❌ Transaction processing skipped for league ${leagueId}: User not authenticated or doesn't own league`);
      return 0;
    }
    
    logger.debug(`✅ User authorized to process transactions for league ${leagueId}`);

    // Mark as processed for this session
    processedOnceRef.current.add(leagueId);

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

      logger.debug(`Processing ${unprocessedWaivers.length} new waiver transactions for league ${leagueId}`);

      // Process each transaction
      for (const transaction of unprocessedWaivers) {
        try {
          const updates = extractWaiverUpdates(transaction);
          
          if (updates.length === 0) continue;

          // Update salaries for FAAB players (no contracts for FAAB acquisitions)
          const failedPlayerIds: string[] = [];
          for (const update of updates) {
            const salarySuccess = await updatePlayerSalary(leagueId, update.playerId, update.salary, 'faab');

            if (salarySuccess) {
              logger.debug(`Auto-updated FAAB player ${update.playerId}: salary=${update.salary}, acquisition_type=faab (no contract)`);
            } else {
              failedPlayerIds.push(update.playerId);
            }
          }

          // Only record the transaction once its salaries actually landed.
          //
          // This previously ran unconditionally, so a failed write was
          // marked done and never retried — the player kept no salary and
          // nothing pointed at why. Leaving the transaction unrecorded
          // means the next session picks it up again; the write itself is
          // an idempotent upsert, so a partial batch replays safely.
          if (failedPlayerIds.length > 0) {
            logger.warn(
              `Leaving transaction ${transaction.transaction_id} unprocessed — ` +
              `${failedPlayerIds.length} salary write(s) failed (${failedPlayerIds.join(', ')}). ` +
              `It will be retried on the next load.`
            );
            continue;
          }

          await markTransactionProcessed(leagueId, transaction.transaction_id, updates);
          processedCount++;

        } catch (error) {
          logger.error(`Error processing transaction ${transaction.transaction_id}:`, error);
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
      logger.error('Error processing waiver transactions:', error);
      toast({
        title: "Processing Error",
        description: "Error auto-updating waiver transactions. Check console for details.",
        variant: "destructive",
      });
      return 0;
    } finally {
      setProcessing(false);
    }
  }, [toast, user, canModifyLeague, isWaiverTransaction, extractWaiverUpdates]);

  return {
    processWaiverTransactions,
    processing
  };
};

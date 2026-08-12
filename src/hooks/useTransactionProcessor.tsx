import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-context';
import { useLeagueOwnership } from '@/hooks/useLeagueOwnership';
import { securityLogger } from '@/utils/securityLogger';
import { logger } from '@/utils/logger';
import { sortWaiversOldestFirst } from '@/utils/waiverOrdering';
import {
  isWaiverTransaction,
  extractWaiverWrites,
  type SleeperTransactionLike,
} from '@edge/process-waivers/waivers';

/**
 * Salary rows implied by a waiver claim.
 *
 * The pricing rules themselves are NOT defined here. They live in
 * supabase/functions/process-waivers/waivers.ts and are imported above, so
 * this hook and the scheduled job cannot disagree about what a claim is
 * worth. They used to be written out twice and had already drifted: the
 * copy here tested `settings?.waiver_bid` for truthiness, which accepts a
 * negative bid and wrote it through as a negative salary, while the job
 * required `typeof === 'number' && > 0` and skipped it. The same claim was
 * priced differently depending on whether a commissioner happened to have
 * the app open.
 */
type WaiverUpdate = ReturnType<typeof extractWaiverWrites>[number];

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
      const unprocessedWaivers = transactions.filter((transaction) =>
        !processedTransactionIds.has(transaction.transaction_id) &&
        isWaiverTransaction(transaction as SleeperTransactionLike)
      );

      if (unprocessedWaivers.length === 0) {
        return 0;
      }

      logger.debug(`Processing ${unprocessedWaivers.length} new waiver transactions for league ${leagueId}`);

      // Oldest first. Salary writes are last-write-wins per player, and
      // fetchLeagueData concatenates weeks without sorting within a week,
      // so array order can't be trusted to decide the final value.
      const orderedWaivers = sortWaiversOldestFirst(unprocessedWaivers);

      // Players whose pricing chain is stalled because an earlier claim
      // for them failed (or was itself deferred). A later claim for such a
      // player must NOT be recorded as processed: if it were, the pending
      // older claim would be retried on the next load and its stale bid
      // would overwrite the newer salary. Deferring the whole chain keeps
      // retries in order.
      const blockedPlayerIds = new Set<string>();

      // Process each transaction
      for (const transaction of orderedWaivers) {
        try {
          const updates = extractWaiverWrites(transaction as SleeperTransactionLike);

          if (updates.length === 0) continue;

          const playerIds = updates.map(update => update.playerId);

          if (playerIds.some(playerId => blockedPlayerIds.has(playerId))) {
            playerIds.forEach(playerId => blockedPlayerIds.add(playerId));
            logger.warn(
              `Deferring transaction ${transaction.transaction_id} — an earlier claim ` +
              `for one of its players is still pending. Processing it now would let ` +
              `that retry overwrite this newer bid.`
            );
            continue;
          }

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
            // Block every player this transaction touches, not just the
            // ones that failed: the retry rewrites all of them, so a later
            // claim for any of them must wait too.
            playerIds.forEach(playerId => blockedPlayerIds.add(playerId));
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
  }, [toast, user, canModifyLeague]);

  return {
    processWaiverTransactions,
    processing
  };
};

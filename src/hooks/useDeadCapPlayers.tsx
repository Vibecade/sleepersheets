import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface DeadCapPlayer {
  id: string;
  league_id: string;
  player_id: string;
  roster_id: number;
  salary: number | null;
  created_at: string;
  updated_at: string;
}

// Cache for dead cap players to prevent repeated calls
const deadCapCache = new Map<string, { data: DeadCapPlayer[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const useDeadCapPlayers = (leagueId: string) => {
  const [deadCapPlayers, setDeadCapPlayers] = useState<DeadCapPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastLeagueId, setLastLeagueId] = useState<string>('');
  const { toast } = useToast();

  // Load existing dead cap players from database
  const loadDeadCapPlayers = useCallback(async (currentLeagueId: string) => {
    if (!currentLeagueId || currentLeagueId === lastLeagueId) {
      setLoading(false);
      return;
    }

    try {
      logger.debug('Loading dead cap players for league:', currentLeagueId);
      setLoading(true);
      
      // Check cache first
      const cacheKey = currentLeagueId;
      const cached = deadCapCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        logger.debug('Using cached dead cap players for:', currentLeagueId);
        setDeadCapPlayers(cached.data);
        setLastLeagueId(currentLeagueId);
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('dead_cap_players')
        .select('*')
        .eq('league_id', currentLeagueId);

      if (error) {
        logger.error('Error loading dead cap players:', error);
        return;
      }

      logger.debug('Loaded dead cap players:', data);
      setDeadCapPlayers(data || []);
      setLastLeagueId(currentLeagueId);
      
      // Cache the result
      deadCapCache.set(cacheKey, { data: data || [], timestamp: Date.now() });
    } catch (error) {
      logger.error('Error loading dead cap players:', error);
    } finally {
      setLoading(false);
    }
  }, [lastLeagueId]);

  useEffect(() => {
    if (leagueId && leagueId !== lastLeagueId) {
      loadDeadCapPlayers(leagueId);
    }
  }, [leagueId, loadDeadCapPlayers, lastLeagueId]);

  // Add dead cap player
  const addDeadCapPlayer = async (playerId: string, rosterId: number, salary: number | null) => {
    try {
      logger.debug('Adding dead cap player:', playerId, rosterId, salary);
      const { data, error } = await supabase
        .from('dead_cap_players')
        .insert({
          league_id: leagueId,
          player_id: playerId,
          roster_id: rosterId,
          salary: salary,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error adding dead cap player:', error);
        toast({
          title: "Error",
          description: "Failed to add dead cap player",
          variant: "destructive"
        });
        return false;
      }

      setDeadCapPlayers(prev => [...prev, data]);
      
      // Update cache
      const cacheKey = leagueId;
      const cached = deadCapCache.get(cacheKey);
      if (cached) {
        deadCapCache.set(cacheKey, { 
          data: [...cached.data, data], 
          timestamp: Date.now() 
        });
      }
      
      toast({
        title: "Success",
        description: "Dead cap player added successfully",
      });
      return true;
    } catch (error) {
      logger.error('Error adding dead cap player:', error);
      toast({
        title: "Error",
        description: "Failed to add dead cap player",
        variant: "destructive"
      });
      return false;
    }
  };

  // Update dead cap player salary
  const updateDeadCapPlayer = async (id: string, salary: number | null) => {
    try {
      logger.debug('Updating dead cap player:', id, salary);
      const { error } = await supabase
        .from('dead_cap_players')
        .update({
          salary: salary,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        logger.error('Error updating dead cap player:', error);
        toast({
          title: "Error",
          description: "Failed to update dead cap player",
          variant: "destructive"
        });
        return false;
      }

      const updatedPlayers = deadCapPlayers.map(player => 
        player.id === id ? { ...player, salary, updated_at: new Date().toISOString() } : player
      );
      
      setDeadCapPlayers(updatedPlayers);
      
      // Update cache
      const cacheKey = leagueId;
      deadCapCache.set(cacheKey, { 
        data: updatedPlayers, 
        timestamp: Date.now() 
      });
      
      toast({
        title: "Success",
        description: "Dead cap player updated successfully",
      });
      return true;
    } catch (error) {
      logger.error('Error updating dead cap player:', error);
      toast({
        title: "Error",
        description: "Failed to update dead cap player",
        variant: "destructive"
      });
      return false;
    }
  };

  // Remove dead cap player
  const removeDeadCapPlayer = async (id: string) => {
    try {
      logger.debug('Removing dead cap player:', id);
      const { error } = await supabase
        .from('dead_cap_players')
        .delete()
        .eq('id', id);

      if (error) {
        logger.error('Error removing dead cap player:', error);
        toast({
          title: "Error",
          description: "Failed to remove dead cap player",
          variant: "destructive"
        });
        return false;
      }

      const filteredPlayers = deadCapPlayers.filter(player => player.id !== id);
      setDeadCapPlayers(filteredPlayers);
      
      // Update cache
      const cacheKey = leagueId;
      deadCapCache.set(cacheKey, { 
        data: filteredPlayers, 
        timestamp: Date.now() 
      });
      
      toast({
        title: "Success",
        description: "Dead cap player removed successfully",
      });
      return true;
    } catch (error) {
      logger.error('Error removing dead cap player:', error);
      toast({
        title: "Error",
        description: "Failed to remove dead cap player",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    deadCapPlayers,
    addDeadCapPlayer,
    updateDeadCapPlayer,
    removeDeadCapPlayer,
    loading
  };
};
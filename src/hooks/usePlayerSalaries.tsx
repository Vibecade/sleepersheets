import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { validateSalary } from '@/utils/inputValidation';
import { logDataAccess } from '@/utils/securityLogger';

interface PlayerSalary {
  player_id: string;
  salary: number | null;
  taxi_squad: boolean;
  acquisition_type: 'contract' | 'faab' | 'free_agent';
}

export const usePlayerSalaries = (leagueId: string) => {
  const [salaries, setSalaries] = useState<Record<string, number | null>>({});
  const [taxiSquadStatus, setTaxiSquadStatus] = useState<Record<string, boolean>>({});
  const [data, setData] = useState<PlayerSalary[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastLeagueId, setLastLeagueId] = useState<string>('');
  const { toast } = useToast();
  const { user } = useAuth();

  const loadSalaries = useCallback(async (currentLeagueId: string) => {
    if (!currentLeagueId || currentLeagueId === lastLeagueId) {
      setLoading(false);
      return;
    }

    try {
      console.log('Loading salaries for league:', currentLeagueId);
      setLoading(true);
      
      const { data, error } = await supabase
        .from('player_salaries')
        .select('player_id, salary, taxi_squad, acquisition_type')
        .eq('league_id', currentLeagueId) as { data: PlayerSalary[] | null; error: any };

      logDataAccess(user?.id, 'player_salaries', 'read', !error);

      if (error) {
        console.error('Error loading salaries:', error);
        return;
      }

      console.log('Loaded salary data:', data);
      const salaryMap: Record<string, number | null> = {};
      const taxiMap: Record<string, boolean> = {};
      
      if (data) {
        data.forEach((item) => {
          salaryMap[item.player_id] = item.salary;
          taxiMap[item.player_id] = item.taxi_squad || false;
        });
      }
      
      setSalaries(salaryMap);
      setTaxiSquadStatus(taxiMap);
      setData(data || []);
      setLastLeagueId(currentLeagueId);
    } catch (error) {
      console.error('Error loading salaries:', error);
      logDataAccess(user?.id, 'player_salaries', 'read', false);
    } finally {
      setLoading(false);
    }
  }, [user?.id, lastLeagueId]);

  useEffect(() => {
    if (leagueId && leagueId !== lastLeagueId) {
      loadSalaries(leagueId);
    }
  }, [leagueId, loadSalaries, lastLeagueId]);

  const updateSalary = async (playerId: string, salary: number | null) => {
    // Validate salary input
    if (salary !== null) {
      const validation = validateSalary(salary);
      if (!validation.isValid) {
        toast({
          title: "Invalid Salary",
          description: validation.error,
          variant: "destructive"
        });
        return false;
      }
    }

    try {
      console.log('Updating salary for player:', playerId, 'salary:', salary);
      const { error } = await supabase
        .from('player_salaries')
        .upsert({
          league_id: leagueId,
          player_id: playerId,
          salary: salary,
          taxi_squad: taxiSquadStatus[playerId] || false,
          acquisition_type: 'contract',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'league_id,player_id'
        });

      logDataAccess(user?.id, 'player_salaries', 'write', !error);

      if (error) {
        console.error('Error updating salary:', error);
        toast({
          title: "Error",
          description: "Failed to save salary",
          variant: "destructive"
        });
        return false;
      }

      setSalaries(prev => ({ ...prev, [playerId]: salary }));
      toast({
        title: "Success",
        description: "Salary saved successfully",
      });
      return true;
    } catch (error) {
      console.error('Error updating salary:', error);
      logDataAccess(user?.id, 'player_salaries', 'write', false);
      toast({
        title: "Error",
        description: "Failed to save salary",
        variant: "destructive"
      });
      return false;
    }
  };

  const updateTaxiSquadStatus = async (playerId: string, taxiSquad: boolean) => {
    try {
      console.log('Updating taxi squad status for player:', playerId, 'taxi_squad:', taxiSquad);
      const { error } = await supabase
        .from('player_salaries')
        .upsert({
          league_id: leagueId,
          player_id: playerId,
          salary: salaries[playerId],
          taxi_squad: taxiSquad,
          acquisition_type: 'contract',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'league_id,player_id'
        });

      logDataAccess(user?.id, 'player_salaries', 'write', !error);

      if (error) {
        console.error('Error updating taxi squad status:', error);
        toast({
          title: "Error",
          description: "Failed to save taxi squad status",
          variant: "destructive"
        });
        return false;
      }

      setTaxiSquadStatus(prev => ({ ...prev, [playerId]: taxiSquad }));
      toast({
        title: "Success",
        description: "Taxi squad status updated successfully",
      });
      return true;
    } catch (error) {
      console.error('Error updating taxi squad status:', error);
      logDataAccess(user?.id, 'player_salaries', 'write', false);
      toast({
        title: "Error",
        description: "Failed to save taxi squad status",
        variant: "destructive"
      });
      return false;
    }
  };

  const getEffectiveSalary = useCallback((playerId: string): number => {
    const baseSalary = salaries[playerId] || 0;
    const isTaxiSquad = taxiSquadStatus[playerId] || false;
    
    if (isTaxiSquad && baseSalary > 0) {
      return Math.max(1, Math.round(baseSalary * 0.25));
    }
    
    return baseSalary;
  }, [salaries, taxiSquadStatus]);

  const getSalaryCapContribution = useCallback((playerId: string): number => {
    const baseSalary = salaries[playerId] || 0;
    const isTaxiSquad = taxiSquadStatus[playerId] || false;
    
    // FAAB acquisitions don't count toward salary cap
    const acquisitionType = data?.find(item => item.player_id === playerId)?.acquisition_type || 'contract';
    if (acquisitionType === 'faab') {
      return 0;
    }
    
    if (isTaxiSquad && baseSalary > 0) {
      return Math.max(1, Math.round(baseSalary * 0.25));
    }
    
    return baseSalary;
  }, [salaries, taxiSquadStatus, data]);

  return {
    salaries,
    taxiSquadStatus,
    updateSalary,
    updateTaxiSquadStatus,
    getEffectiveSalary,
    getSalaryCapContribution,
    loading
  };
};
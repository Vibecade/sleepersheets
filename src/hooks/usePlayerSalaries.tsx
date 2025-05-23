
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PlayerSalary {
  player_id: string;
  salary: number | null;
}

export const usePlayerSalaries = (leagueId: string) => {
  const [salaries, setSalaries] = useState<Record<string, number | null>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load existing salaries from database
  useEffect(() => {
    const loadSalaries = async () => {
      try {
        const { data, error } = await supabase
          .from('player_salaries')
          .select('player_id, salary')
          .eq('league_id', leagueId);

        if (error) {
          console.error('Error loading salaries:', error);
          return;
        }

        const salaryMap: Record<string, number | null> = {};
        data?.forEach((item) => {
          salaryMap[item.player_id] = item.salary;
        });
        setSalaries(salaryMap);
      } catch (error) {
        console.error('Error loading salaries:', error);
      } finally {
        setLoading(false);
      }
    };

    if (leagueId) {
      loadSalaries();
    }
  }, [leagueId]);

  // Update salary in database
  const updateSalary = async (playerId: string, salary: number | null) => {
    try {
      const { error } = await supabase
        .from('player_salaries')
        .upsert({
          league_id: leagueId,
          player_id: playerId,
          salary: salary,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'league_id,player_id'
        });

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
      return true;
    } catch (error) {
      console.error('Error updating salary:', error);
      toast({
        title: "Error",
        description: "Failed to save salary",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    salaries,
    updateSalary,
    loading
  };
};

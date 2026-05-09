import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface CommissionerActionData {
  action_type: string;
  target_type?: string;
  target_id?: string;
  description: string;
  metadata?: any;
}

export const useCommissionerActions = (leagueId: string) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const logAction = async (actionData: CommissionerActionData): Promise<boolean> => {
    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      
      if (!user.user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('commissioner_actions')
        .insert({
          league_id: leagueId,
          commissioner_id: user.user.id,
          ...actionData
        });

      if (error) {
        logger.error('Error logging commissioner action:', error);
        throw error;
      }

      return true;
    } catch (error) {
      logger.error('Error logging commissioner action:', error);
      toast({
        title: "Error",
        description: "Failed to log commissioner action",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    logAction,
    loading
  };
};
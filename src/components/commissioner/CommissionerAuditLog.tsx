import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Shield, Settings, Users, FileX, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface CommissionerAction {
  id: string;
  action_type: string;
  target_type: string;
  target_id: string;
  description: string;
  metadata: any;
  created_at: string;
}

interface CommissionerAuditLogProps {
  leagueId: string;
  limit?: number;
}

export const CommissionerAuditLog = ({ leagueId, limit = 10 }: CommissionerAuditLogProps) => {
  const [actions, setActions] = useState<CommissionerAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActions();
  }, [leagueId, limit]);

  const loadActions = async () => {
    try {
      const { data, error } = await supabase
        .from('commissioner_actions')
        .select('*')
        .eq('league_id', leagueId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setActions(data || []);
    } catch (error) {
      console.error('Error loading commissioner actions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'settings_update':
        return <Settings className="h-4 w-4 text-blue-500" />;
      case 'ownership_transfer':
        return <Users className="h-4 w-4 text-green-500" />;
      case 'transaction_override':
        return <FileX className="h-4 w-4 text-orange-500" />;
      default:
        return <Shield className="h-4 w-4 text-primary" />;
    }
  };

  const getActionBadgeVariant = (actionType: string) => {
    switch (actionType) {
      case 'settings_update':
        return 'default';
      case 'ownership_transfer':
        return 'secondary';
      case 'transaction_override':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-lg border p-3 space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (actions.length === 0) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No commissioner actions recorded yet.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      {actions.map((action) => (
        <div
          key={action.id}
          className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
        >
          {getActionIcon(action.action_type)}
          
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant={getActionBadgeVariant(action.action_type) as any}>
                {action.action_type.replace('_', ' ')}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {format(new Date(action.created_at), 'MMM d, HH:mm')}
              </span>
            </div>
            
            <p className="text-sm">{action.description}</p>
            
            {action.target_type && action.target_id && (
              <p className="text-xs text-muted-foreground">
                Target: {action.target_type} ({action.target_id})
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

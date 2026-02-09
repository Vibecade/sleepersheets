
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Users, Activity, Calendar, Target, RefreshCw, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LeagueHeaderProps {
  league: any;
  transactionCount: number;
  draftPickCount: number;
  draftCount: number;
  onRefreshData?: () => Promise<void>;
  compact?: boolean;
}

const LeagueHeader: React.FC<LeagueHeaderProps> = ({ 
  league, 
  transactionCount, 
  draftPickCount, 
  draftCount,
  onRefreshData,
  compact = false
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const { toast } = useToast();

  const handleRefresh = async () => {
    if (!onRefreshData || isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await onRefreshData();
      setLastRefreshed(new Date());
      toast({
        title: "Data refreshed",
        description: "League data has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Failed to refresh league data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Compact mobile version
  if (compact) {
    return (
      <Card className="glass-card border-gradient">
        <CardContent className="p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="bg-gradient-to-br from-primary via-primary-glow to-primary-deep rounded-lg p-2 flex-shrink-0">
                <Trophy className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold truncate">{league.name}</h2>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Season {league.season}</span>
                  <span className="w-1 h-1 bg-muted-foreground/40 rounded-full"></span>
                  <span>{league.total_rosters} Teams</span>
                </div>
              </div>
            </div>
            {onRefreshData && (
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                size="icon"
                variant="ghost"
                className="flex-shrink-0"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full desktop version
  return (
    <Card className="glass-card fade-in border-gradient">
      <CardHeader className="pb-6">
...
      </CardHeader>
      
      <CardContent className="pt-0">
...
      </CardContent>
    </Card>
  );
};

export default LeagueHeader;

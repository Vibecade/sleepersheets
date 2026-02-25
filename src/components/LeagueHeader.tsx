
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Users, Activity, Calendar, Target, RefreshCw, CheckCircle, Minimize2, Maximize2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LeagueHeaderProps {
  league: any;
  transactionCount: number;
  draftPickCount: number;
  draftCount: number;
  onRefreshData?: () => Promise<void>;
  compact?: boolean;
  isCompactMode?: boolean;
  onToggleCompactMode?: () => void;
}

const LeagueHeader: React.FC<LeagueHeaderProps> = ({ 
  league, 
  transactionCount, 
  draftPickCount, 
  draftCount,
  onRefreshData,
  compact = false,
  isCompactMode = false,
  onToggleCompactMode
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
    } catch {
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
            <div className="flex items-center gap-1">
              {onToggleCompactMode && (
                <Button
                  onClick={onToggleCompactMode}
                  size="icon"
                  variant="ghost"
                  className="flex-shrink-0"
                  aria-label={isCompactMode ? 'Expand spacing' : 'Use compact spacing'}
                  title={isCompactMode ? 'Expand spacing' : 'Use compact spacing'}
                >
                  {isCompactMode ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </Button>
              )}
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
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full desktop version
  return (
    <Card className="glass-card fade-in border-gradient">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="bg-gradient-to-br from-primary via-primary-glow to-primary-deep rounded-xl p-3 shadow-lg">
              <Trophy className="w-6 h-6 text-white" />
            </div>

            <div>
              <CardTitle className="text-2xl">{league.name}</CardTitle>
              <CardDescription className="mt-1 text-sm">
                Season {league.season} • {league.total_rosters} teams
              </CardDescription>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  League Active
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {lastRefreshed
                    ? `Updated ${lastRefreshed.toLocaleTimeString([], {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}`
                    : 'Live Data'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {onToggleCompactMode && (
              <Button
                onClick={onToggleCompactMode}
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
              >
                {isCompactMode ? <Maximize2 className="w-4 h-4 mr-2" /> : <Minimize2 className="w-4 h-4 mr-2" />}
                {isCompactMode ? 'Comfort Spacing' : 'Compact Spacing'}
              </Button>
            )}
            {onRefreshData && (
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                variant="outline"
                className="w-full lg:w-auto"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing' : 'Refresh Data'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5">
            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide">
              <Users className="w-3.5 h-3.5" />
              Teams
            </div>
            <p className="mt-1 text-xl font-semibold">{league.total_rosters ?? 0}</p>
          </div>

          <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5">
            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide">
              <Activity className="w-3.5 h-3.5" />
              Transactions
            </div>
            <p className="mt-1 text-xl font-semibold">{transactionCount}</p>
          </div>

          <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5">
            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide">
              <Target className="w-3.5 h-3.5" />
              Draft Picks
            </div>
            <p className="mt-1 text-xl font-semibold">{draftPickCount}</p>
          </div>

          <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5">
            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide">
              <Calendar className="w-3.5 h-3.5" />
              Drafts
            </div>
            <p className="mt-1 text-xl font-semibold">{draftCount}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeagueHeader;

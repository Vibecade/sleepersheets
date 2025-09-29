
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
}

const LeagueHeader: React.FC<LeagueHeaderProps> = ({ 
  league, 
  transactionCount, 
  draftPickCount, 
  draftCount,
  onRefreshData
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

  return (
    <Card className="glass-card fade-in border-gradient">
      <CardHeader className="pb-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 lg:gap-6">
          {/* Main Header Section */}
          <div className="flex items-center space-x-4 lg:space-x-6 flex-1">
            <div className="relative">
              <div className="bg-gradient-to-br from-primary via-primary-glow to-primary-deep rounded-2xl p-4 shadow-xl ring-1 ring-white/10">
                <Trophy className="w-8 h-8 lg:w-10 lg:h-10 text-white drop-shadow-lg" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full shadow-lg ring-2 ring-background"></div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <CardTitle className="text-2xl lg:text-4xl font-headline font-bold bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent truncate">
                  {league.name}
                </CardTitle>
                <Badge variant="secondary" className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary border-primary/20 flex-shrink-0">
                  {league.total_rosters} Teams
                </Badge>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium">Season {league.season}</span>
                {lastRefreshed && (
                  <>
                    <span className="w-1 h-1 bg-muted-foreground/40 rounded-full"></span>
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-emerald-500" />
                      Updated {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-3 lg:flex-shrink-0">
            {onRefreshData && (
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary text-primary-foreground font-medium px-6 py-2.5 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-70"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Syncing...' : 'Re-sync Data'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <div className="group">
            <div className="glass p-4 lg:p-6 rounded-2xl text-center transition-all duration-200 hover:scale-[1.02] hover:shadow-lg border border-border/50 hover:border-primary/20">
              <div className="flex items-center justify-center mb-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 ring-1 ring-emerald-500/30">
                  <Users className="w-5 h-5 lg:w-6 lg:h-6 text-emerald-400" />
                </div>
              </div>
              <div className="text-2xl lg:text-3xl font-bold text-foreground mb-1">{league.total_rosters}</div>
              <div className="text-xs lg:text-sm text-muted-foreground font-medium">Teams</div>
            </div>
          </div>
          
          <div className="group">
            <div className="glass p-4 lg:p-6 rounded-2xl text-center transition-all duration-200 hover:scale-[1.02] hover:shadow-lg border border-border/50 hover:border-primary/20">
              <div className="flex items-center justify-center mb-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 ring-1 ring-blue-500/30">
                  <Activity className="w-5 h-5 lg:w-6 lg:h-6 text-blue-400" />
                </div>
              </div>
              <div className="text-2xl lg:text-3xl font-bold text-foreground mb-1">{transactionCount}</div>
              <div className="text-xs lg:text-sm text-muted-foreground font-medium">Transactions</div>
            </div>
          </div>
          
          <div className="group">
            <div className="glass p-4 lg:p-6 rounded-2xl text-center transition-all duration-200 hover:scale-[1.02] hover:shadow-lg border border-border/50 hover:border-primary/20">
              <div className="flex items-center justify-center mb-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 ring-1 ring-purple-500/30">
                  <Target className="w-5 h-5 lg:w-6 lg:h-6 text-purple-400" />
                </div>
              </div>
              <div className="text-2xl lg:text-3xl font-bold text-foreground mb-1">{draftPickCount}</div>
              <div className="text-xs lg:text-sm text-muted-foreground font-medium">Draft Picks</div>
            </div>
          </div>
          
          <div className="group">
            <div className="glass p-4 lg:p-6 rounded-2xl text-center transition-all duration-200 hover:scale-[1.02] hover:shadow-lg border border-border/50 hover:border-primary/20">
              <div className="flex items-center justify-center mb-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/20 ring-1 ring-orange-500/30">
                  <Calendar className="w-5 h-5 lg:w-6 lg:h-6 text-orange-400" />
                </div>
              </div>
              <div className="text-2xl lg:text-3xl font-bold text-foreground mb-1">{draftCount}</div>
              <div className="text-xs lg:text-sm text-muted-foreground font-medium">Drafts</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeagueHeader;

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface IntegrityLog {
  id: string;
  league_id: string;
  table_name: string;
  operation_type: string;
  violation_type: string;
  details: any;
  user_id?: string;
  created_at: string;
}

interface IntegrityStats {
  total_violations: number;
  rls_violations: number;
  league_not_found: number;
  recent_violations: number;
  affected_leagues: number;
}

export const DataIntegrityMonitor: React.FC = () => {
  const [logs, setLogs] = useState<IntegrityLog[]>([]);
  const [stats, setStats] = useState<IntegrityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchIntegrityData = async () => {
    try {
      // Fetch recent integrity logs
      const { data: logsData, error: logsError } = await supabase
        .from('data_integrity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (logsError) throw logsError;

      // Fetch integrity statistics
      const { data: statsData, error: statsError } = await supabase
        .from('data_integrity_logs')
        .select('*');

      if (statsError) throw statsError;

      setLogs(logsData || []);

      // Calculate statistics
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const totalViolations = statsData?.length || 0;
      const rlsViolations = statsData?.filter(log => log.violation_type === 'rls_violation').length || 0;
      const leagueNotFound = statsData?.filter(log => log.violation_type === 'league_not_found').length || 0;
      const recentViolations = statsData?.filter(log => new Date(log.created_at) > oneDayAgo).length || 0;
      const affectedLeagues = new Set(statsData?.map(log => log.league_id)).size || 0;

      setStats({
        total_violations: totalViolations,
        rls_violations: rlsViolations,
        league_not_found: leagueNotFound,
        recent_violations: recentViolations,
        affected_leagues: affectedLeagues
      });

    } catch (error) {
      console.error('Error fetching integrity data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch integrity monitoring data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchIntegrityData();
  };

  useEffect(() => {
    fetchIntegrityData();
    
    // Set up real-time subscription for new violations
    const subscription = supabase
      .channel('integrity_logs')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'data_integrity_logs' },
        (payload) => {
          setLogs(prev => [payload.new as IntegrityLog, ...prev.slice(0, 49)]);
          fetchIntegrityData(); // Refresh stats
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const getViolationBadgeVariant = (violationType: string) => {
    switch (violationType) {
      case 'rls_violation':
        return 'destructive';
      case 'league_not_found':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Data Integrity Monitor</CardTitle>
          <CardDescription>Loading integrity monitoring data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Data Integrity Monitor</CardTitle>
            <CardDescription>Real-time monitoring of data integrity violations and RLS policy enforcement</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
      </Card>

      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="text-sm font-medium">Total Violations</p>
                  <p className="text-2xl font-bold">{stats.total_violations}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">RLS Violations</p>
                  <p className="text-2xl font-bold">{stats.rls_violations}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium">League Not Found</p>
                  <p className="text-2xl font-bold">{stats.league_not_found}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Recent (24h)</p>
                  <p className="text-2xl font-bold">{stats.recent_violations}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Affected Leagues</p>
                  <p className="text-2xl font-bold">{stats.affected_leagues}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Violations</CardTitle>
          <CardDescription>Latest data integrity violations and policy enforcement actions</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                No integrity violations detected. All data operations are passing validation checks.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant={getViolationBadgeVariant(log.violation_type)}>
                        {log.violation_type.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <span className="text-sm font-medium">{log.table_name}</span>
                      <span className="text-sm text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">{log.operation_type}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      League: {log.league_id}
                    </p>
                    {log.details && (
                      <pre className="text-xs bg-muted p-2 rounded max-w-md overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{formatTimeAgo(log.created_at)}</p>
                    {log.user_id && (
                      <p className="text-xs text-muted-foreground">User: {log.user_id.slice(0, 8)}...</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
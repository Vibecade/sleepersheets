import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCommissionerActions } from '@/hooks/useCommissionerActions';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  FileX, 
  Check, 
  X, 
  RotateCcw, 
  AlertTriangle,
  TrendingUp,
  ArrowRightLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { SkeletonCard } from '@/components/ui/skeleton-card';

interface TransactionManagementProps {
  leagueId: string;
  leagueData: any;
}

interface Transaction {
  id: string;
  transaction_id: string;
  type: string;
  status: string;
  creator: string;
  adds: any;
  drops: any;
  draft_picks: any;
  waiver_budget: any;
  created_at: string;
  metadata: any;
}

export const TransactionManagement = ({ leagueId, leagueData }: TransactionManagementProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('recent');
  const { logAction } = useCommissionerActions(leagueId);
  const { toast } = useToast();

  useEffect(() => {
    loadTransactions();
  }, [leagueId]);

  const loadTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('league_transactions')
        .select('*')
        .eq('league_id', leagueId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionAction = async (
    transaction: Transaction, 
    action: 'approve' | 'reject' | 'reverse'
  ) => {
    try {
      // Log the override action
      const { data: user } = await supabase.auth.getUser();
      if (!user.user?.id) throw new Error('User not authenticated');
      
      const { error: overrideError } = await supabase
        .from('transaction_overrides')
        .insert({
          league_id: leagueId,
          transaction_id: transaction.transaction_id,
          commissioner_id: user.user.id,
          action,
          reason: `Commissioner ${action} action`,
          original_data: transaction as any,
          modified_data: { ...transaction, status: action === 'approve' ? 'complete' : 'failed' } as any
        });

      if (overrideError) throw overrideError;

      // Log commissioner action
      await logAction({
        action_type: 'transaction_override',
        target_type: 'transaction',
        target_id: transaction.transaction_id,
        description: `${action.charAt(0).toUpperCase() + action.slice(1)}d transaction ${transaction.transaction_id}`,
        metadata: { 
          transaction_type: transaction.type,
          action,
          original_status: transaction.status
        }
      });

      toast({
        title: "Transaction Updated",
        description: `Transaction has been ${action}d successfully.`,
      });

      // Reload transactions
      loadTransactions();
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast({
        title: "Error",
        description: `Failed to ${action} transaction. Please try again.`,
        variant: "destructive"
      });
    }
  };

  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case 'trade':
        return <ArrowRightLeft className="h-4 w-4" />;
      case 'waiver':
        return <TrendingUp className="h-4 w-4" />;
      case 'free_agent':
        return <FileX className="h-4 w-4" />;
      default:
        return <FileX className="h-4 w-4" />;
    }
  };

  const getTransactionStatusBadge = (status: string) => {
    const statusConfig = {
      complete: { variant: 'default' as const, label: 'Complete' },
      failed: { variant: 'destructive' as const, label: 'Failed' },
      pending: { variant: 'secondary' as const, label: 'Pending' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { variant: 'outline' as const, label: status };
    
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const renderTransactionDetails = (transaction: Transaction) => {
    const users = leagueData?.users || {};
    const creator = users[transaction.creator];
    
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getTransactionTypeIcon(transaction.type)}
            <span className="font-medium capitalize">{transaction.type.replace('_', ' ')}</span>
            {getTransactionStatusBadge(transaction.status)}
          </div>
          <div className="text-sm text-muted-foreground">
            {format(new Date(transaction.created_at), 'MMM d, yyyy HH:mm')}
          </div>
        </div>

        <div className="text-sm">
          <strong>Creator:</strong> {creator?.display_name || creator?.username || 'Unknown User'}
        </div>

        {transaction.adds && Object.keys(transaction.adds).length > 0 && (
          <div>
            <div className="text-sm font-medium text-green-600 mb-1">Adds:</div>
            <div className="text-sm text-muted-foreground ml-4">
              {Object.entries(transaction.adds).map(([playerId, rosterId]) => (
                <div key={playerId}>Player {playerId} → Team {String(rosterId)}</div>
              ))}
            </div>
          </div>
        )}

        {transaction.drops && Object.keys(transaction.drops).length > 0 && (
          <div>
            <div className="text-sm font-medium text-red-600 mb-1">Drops:</div>
            <div className="text-sm text-muted-foreground ml-4">
              {Object.entries(transaction.drops).map(([playerId, rosterId]) => (
                <div key={playerId}>Player {playerId} from Team {String(rosterId)}</div>
              ))}
            </div>
          </div>
        )}

        {transaction.waiver_budget && Object.keys(transaction.waiver_budget).length > 0 && (
          <div>
            <div className="text-sm font-medium text-blue-600 mb-1">FAAB Spending:</div>
            <div className="text-sm text-muted-foreground ml-4">
              {Object.entries(transaction.waiver_budget).map(([rosterId, amount]) => (
                <div key={rosterId}>Team {rosterId}: ${String(amount)}</div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleTransactionAction(transaction, 'approve')}
            className="gap-1"
          >
            <Check className="h-3 w-3" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleTransactionAction(transaction, 'reject')}
            className="gap-1"
          >
            <X className="h-3 w-3" />
            Reject
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleTransactionAction(transaction, 'reverse')}
            className="gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            Reverse
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonCard lines={4} />
        <SkeletonCard lines={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileX className="h-5 w-5 text-primary" />
        <div>
          <h2 className="text-xl font-semibold">Transaction Management</h2>
          <p className="text-sm text-muted-foreground">
            Review, approve, and manage all league transactions
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="overrides">Overrides</TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                All recent league transactions and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    No transactions found for this league.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <Card key={transaction.id} className="p-4">
                      {renderTransactionDetails(transaction)}
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Transactions</CardTitle>
              <CardDescription>
                Transactions awaiting commissioner approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No pending transactions require commissioner action at this time.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overrides">
          <Card>
            <CardHeader>
              <CardTitle>Commissioner Overrides</CardTitle>
              <CardDescription>
                History of commissioner transaction interventions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No commissioner overrides have been performed yet.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

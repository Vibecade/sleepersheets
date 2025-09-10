import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, Users, TrendingUp } from 'lucide-react';
import FAABPlayerRow from './FAABPlayerRow';

interface FAABTransaction {
  playerId: string;
  faabAmount: number;
  rosterId: number;
  transactionId: string;
  created: string;
}

interface FAABContractManagerProps {
  transactions: any[];
  players: Record<string, any>;
  userMap: Record<string, any>;
  rosters: any[];
  leagueId: string;
}

const FAABContractManager: React.FC<FAABContractManagerProps> = ({
  transactions,
  players,
  userMap,
  rosters,
  leagueId
}) => {
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  // Extract FAAB transactions from the API data
  const faabTransactions: FAABTransaction[] = React.useMemo(() => {
    const faabTxns: FAABTransaction[] = [];
    
    transactions.forEach(txn => {
      if (txn.type === 'waiver' && 
          txn.status === 'complete' && 
          txn.settings?.waiver_bid && 
          typeof txn.settings.waiver_bid === 'number' &&
          txn.adds) {
        
        Object.entries(txn.adds).forEach(([playerId, rosterId]) => {
          if (typeof rosterId === 'number') {
            faabTxns.push({
              playerId,
              faabAmount: txn.settings.waiver_bid,
              rosterId: rosterId as number,
              transactionId: txn.transaction_id,
              created: txn.created?.toString() || Date.now().toString()
            });
          }
        });
      }
    });
    
    return faabTxns.sort((a, b) => parseInt(b.created) - parseInt(a.created));
  }, [transactions]);

  // Calculate FAAB spending by team
  const teamFAABSpending = React.useMemo(() => {
    const spending: Record<number, number> = {};
    
    faabTransactions.forEach(txn => {
      spending[txn.rosterId] = (spending[txn.rosterId] || 0) + txn.faabAmount;
    });
    
    return spending;
  }, [faabTransactions]);

  const displayedTransactions = showAllTransactions 
    ? faabTransactions 
    : faabTransactions.slice(0, 10);

  const totalFAABSpent = faabTransactions.reduce((sum, txn) => sum + txn.faabAmount, 0);
  const uniquePlayers = new Set(faabTransactions.map(txn => txn.playerId)).size;

  return (
    <Card className="border border-blue-400/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-blue-400" />
            <span>FAAB Contract Tracker</span>
          </CardTitle>
          <Badge className="bg-blue-500 text-white">
            {faabTransactions.length} Acquisitions
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-400/20">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-muted-foreground">Total FAAB Spent</span>
            </div>
            <span className="text-lg font-bold text-blue-400">${totalFAABSpent}</span>
          </div>
          
          <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-400/20">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-muted-foreground">Players Acquired</span>
            </div>
            <span className="text-lg font-bold text-blue-400">{uniquePlayers}</span>
          </div>
          
          <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-400/20">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-muted-foreground">Avg FAAB Bid</span>
            </div>
            <span className="text-lg font-bold text-blue-400">
              ${faabTransactions.length > 0 ? Math.round(totalFAABSpent / faabTransactions.length) : 0}
            </span>
          </div>
        </div>

        {/* Team FAAB Spending Summary */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">FAAB Spending by Team</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.entries(teamFAABSpending).map(([rosterId, spent]) => {
              const roster = rosters.find(r => r.roster_id === parseInt(rosterId));
              const user = userMap[roster?.owner_id];
              return (
                <div key={rosterId} className="flex justify-between items-center bg-accent/20 rounded p-2">
                  <span className="text-sm text-foreground">
                    {user?.metadata?.team_name || user?.display_name || 'Unknown Team'}
                  </span>
                  <Badge className="bg-blue-500 text-white text-xs">
                    ${spent}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>

        {/* FAAB Transactions List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">Recent FAAB Acquisitions</h4>
            {faabTransactions.length > 10 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllTransactions(!showAllTransactions)}
                className="text-xs"
              >
                {showAllTransactions ? 'Show Less' : `Show All (${faabTransactions.length})`}
              </Button>
            )}
          </div>
          
          {displayedTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="w-12 h-12 mx-auto mb-2 text-muted-foreground/50" />
              <p>No FAAB acquisitions found</p>
              <p className="text-xs">FAAB transactions will appear here when players are claimed</p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayedTransactions.map((txn, index) => (
                <FAABPlayerRow
                  key={`${txn.transactionId}-${txn.playerId}`}
                  playerId={txn.playerId}
                  player={players[txn.playerId]}
                  faabAmount={txn.faabAmount}
                  rosterId={txn.rosterId}
                  userMap={userMap}
                  transactionDate={txn.created}
                />
              ))}
            </div>
          )}
        </div>

        <div className="bg-blue-500/5 rounded-lg p-3 border border-blue-400/10">
          <p className="text-xs text-blue-400">
            <strong>💡 How it works:</strong> Players acquired via FAAB show a salary of $0 but track the actual FAAB amount spent. 
            This keeps salary cap calculations separate from FAAB budget management.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FAABContractManager;
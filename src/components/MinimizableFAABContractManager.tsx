import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, DollarSign } from 'lucide-react';
import FAABContractManager from './FAABContractManager';

interface MinimizableFAABContractManagerProps {
  transactions: any[];
  players: Record<string, any>;
  userMap: Record<string, any>;
  rosters: any[];
  leagueId: string;
}

const MinimizableFAABContractManager: React.FC<MinimizableFAABContractManagerProps> = ({
  transactions,
  players,
  userMap,
  rosters,
  leagueId
}) => {
  const [isMinimized, setIsMinimized] = useState(true);

  // Quick stats for minimized view - using same logic as FAABContractManager
  const faabTransactions = React.useMemo(() => {
    const faabTxns: Array<{ playerId: string; faabAmount: number }> = [];
    
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
              faabAmount: txn.settings.waiver_bid
            });
          }
        });
      }
    });
    
    return faabTxns;
  }, [transactions]);

  const totalFAABSpent = faabTransactions.reduce((sum, txn) => sum + txn.faabAmount, 0);
  const totalFAABPlayers = new Set(faabTransactions.map(txn => txn.playerId)).size;

  if (isMinimized) {
    return (
      <Card className="mb-3 border-blue-400/20 bg-accent/5">
        <CardHeader className="py-4 section-sticky-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-blue-400" />
              <h3 className="text-base sm:text-lg font-semibold text-foreground">FAAB Tracker</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Quick stats in minimized view */}
          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-muted-foreground mt-2">
            <div className="flex items-center space-x-2">
              <span className="text-blue-400 font-medium">${totalFAABSpent}</span>
              <span>Total FAAB Spent</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-blue-400 font-medium">{totalFAABPlayers}</span>
              <span>Players Acquired</span>
            </div>
            <span className="text-xs opacity-75">Click to expand details</span>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="mb-3">
      <Card className="border-blue-400/20 bg-accent/5">
        <CardHeader className="py-4 section-sticky-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-blue-400" />
              <h3 className="text-base sm:text-lg font-semibold text-foreground">FAAB Tracker</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(true)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>
      
      <FAABContractManager
        transactions={transactions}
        players={players}
        userMap={userMap}
        rosters={rosters}
        leagueId={leagueId}
      />
    </div>
  );
};

export default MinimizableFAABContractManager;

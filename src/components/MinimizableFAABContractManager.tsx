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

  // Quick stats for minimized view
  const faabTransactions = transactions.filter(t => 
    t.type === 'waiver' && 
    t.status === 'complete' && 
    t.waiver_budget && 
    Object.keys(t.waiver_budget).length > 0
  );

  const totalFAABSpent = faabTransactions.reduce((total, transaction) => {
    return total + Object.values(transaction.waiver_budget).reduce((sum: number, amount: any) => sum + (amount || 0), 0);
  }, 0);

  const totalFAABPlayers = faabTransactions.length;

  if (isMinimized) {
    return (
      <Card className="mb-6 border-blue-400/20 bg-accent/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-foreground">FAAB Tracker</h3>
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
          <div className="flex items-center space-x-6 text-sm text-muted-foreground mt-2">
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
    <div className="mb-6">
      <Card className="border-blue-400/20 bg-accent/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-foreground">FAAB Tracker</h3>
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
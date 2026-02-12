import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowRightLeft } from 'lucide-react';
import TransactionsList from '../TransactionsList';

interface TransactionsTabProps {
  transactions: any[];
  userMap: Record<string, any>;
  players: Record<string, any>;
  league: any;
}

const TransactionsTab: React.FC<TransactionsTabProps> = ({
  transactions,
  userMap,
  players,
  league,
}) => {
  return (
    <Card className="transition-all duration-300 hover:shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <ArrowRightLeft className="w-4 h-4" />
          <CardTitle className="text-base sm:text-lg">League Transactions</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[60vh] md:h-[62vh] w-full">
          <div className="p-4 sm:p-5">
            <TransactionsList
              transactions={transactions}
              userMap={userMap}
              players={players}
              league={league}
            />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TransactionsTab;

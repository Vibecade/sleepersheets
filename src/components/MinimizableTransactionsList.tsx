import React, { memo } from 'react';
import ScrollableModal from './ScrollableModal';
import TransactionsList from './TransactionsList';

interface MinimizableTransactionsListProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactions: any[];
  userMap: Record<string, any>;
  players: Record<string, any>;
  league: any;
}

const MinimizableTransactionsList: React.FC<MinimizableTransactionsListProps> = memo(({
  open,
  onOpenChange,
  transactions,
  userMap,
  players,
  league
}) => {
  if (!open) {
    return null; // Don't render anything if not open
  }
  
  return (
    <ScrollableModal
      open={open}
      onOpenChange={onOpenChange}
      title="League Transactions"
      maxHeight="85vh"
    >
      <TransactionsList
        transactions={transactions}
        userMap={userMap}
        players={players}
        league={league}
      />
    </ScrollableModal>
  );
});

MinimizableTransactionsList.displayName = 'MinimizableTransactionsList';

export default MinimizableTransactionsList;
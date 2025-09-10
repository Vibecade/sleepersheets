import React, { memo } from 'react';
import ScrollableModal from './ScrollableModal';
import FunStatistics from './FunStatistics';

interface MinimizableFunStatisticsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  league: any;
  rosters: any[];
  userMap: Record<string, any>;
  players: Record<string, any>;
  transactions?: any[];
}

const MinimizableFunStatistics: React.FC<MinimizableFunStatisticsProps> = memo(({
  open,
  onOpenChange,
  league,
  rosters,
  userMap,
  players,
  transactions
}) => {
  if (!open) {
    return null; // Don't render anything if not open
  }
  
  return (
    <ScrollableModal
      open={open}
      onOpenChange={onOpenChange}
      title="League Statistics"
      maxHeight="85vh"
    >
      <FunStatistics
        league={league}
        rosters={rosters}
        userMap={userMap}
        players={players}
        transactions={transactions}
      />
    </ScrollableModal>
  );
});

MinimizableFunStatistics.displayName = 'MinimizableFunStatistics';

export default MinimizableFunStatistics;
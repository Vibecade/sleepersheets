import React, { memo } from 'react';
import ScrollableModal from './ScrollableModal';
import ContractDeadCapCalculator from './ContractDeadCapCalculator';

interface MinimizableContractCalculatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leagueId: string;
  players: Record<string, any>;
}

const MinimizableContractCalculator: React.FC<MinimizableContractCalculatorProps> = memo(({
  open,
  onOpenChange,
  leagueId,
  players
}) => {
  if (!open) {
    return null; // Don't render anything if not open
  }
  
  return (
    <ScrollableModal
      open={open}
      onOpenChange={onOpenChange}
      title="Contract Dead Cap Calculator"
      maxHeight="85vh"
    >
      <ContractDeadCapCalculator
        leagueId={leagueId}
        players={players}
      />
    </ScrollableModal>
  );
});

MinimizableContractCalculator.displayName = 'MinimizableContractCalculator';

export default MinimizableContractCalculator;
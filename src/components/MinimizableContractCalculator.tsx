
import React from 'react';
import ScrollableModal from './ScrollableModal';
import ContractDeadCapCalculator from './ContractDeadCapCalculator';

interface MinimizableContractCalculatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leagueId: string;
  players: Record<string, any>;
}

const MinimizableContractCalculator: React.FC<MinimizableContractCalculatorProps> = ({
  open,
  onOpenChange,
  leagueId,
  players
}) => {
  console.log('MinimizableContractCalculator render - open:', open);
  
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
};

export default MinimizableContractCalculator;

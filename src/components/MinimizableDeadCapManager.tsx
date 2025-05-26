
import React from 'react';
import ScrollableModal from './ScrollableModal';
import DeadCapManager from './DeadCapManager';

interface MinimizableDeadCapManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leagueId: string;
  rosters: any[];
  userMap: Record<string, any>;
  players: Record<string, any>;
}

const MinimizableDeadCapManager: React.FC<MinimizableDeadCapManagerProps> = ({
  open,
  onOpenChange,
  leagueId,
  rosters,
  userMap,
  players
}) => {
  return (
    <ScrollableModal
      open={open}
      onOpenChange={onOpenChange}
      title="Dynasty Dead Cap Manager"
      maxHeight="85vh"
    >
      <DeadCapManager
        leagueId={leagueId}
        rosters={rosters}
        userMap={userMap}
        players={players}
      />
    </ScrollableModal>
  );
};

export default MinimizableDeadCapManager;

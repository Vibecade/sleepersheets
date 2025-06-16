import React, { memo } from 'react';
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

const MinimizableDeadCapManager: React.FC<MinimizableDeadCapManagerProps> = memo(({
  open,
  onOpenChange,
  leagueId,
  rosters,
  userMap,
  players
}) => {
  if (!open) {
    return null; // Don't render anything if not open
  }
  
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
});

MinimizableDeadCapManager.displayName = 'MinimizableDeadCapManager';

export default MinimizableDeadCapManager;
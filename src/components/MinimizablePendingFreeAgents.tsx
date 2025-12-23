import React, { memo } from 'react';
import ScrollableModal from './ScrollableModal';
import PendingFreeAgentsDisplay from './PendingFreeAgentsDisplay';
import { usePendingFreeAgents } from '@/hooks/usePendingFreeAgents';

interface MinimizablePendingFreeAgentsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leagueId: string;
  rosters: any[];
  userMap: Record<string, any>;
  players: Record<string, any>;
  salaries: Record<string, number | null>;
  salaryCap: number;
  teamSalaries: Record<number, number>;
}

const MinimizablePendingFreeAgents: React.FC<MinimizablePendingFreeAgentsProps> = memo(({
  open,
  onOpenChange,
  leagueId,
  rosters,
  userMap,
  players,
  salaries,
  salaryCap,
  teamSalaries
}) => {
  const { teamSummaries, leagueTotals, loading } = usePendingFreeAgents({ rosters, leagueId, salaries });

  if (!open) {
    return null;
  }

  return (
    <ScrollableModal
      open={open}
      onOpenChange={onOpenChange}
      title="Pending Free Agents"
      maxHeight="85vh"
    >
      {loading ? (
        <div className="py-8 text-center text-muted-foreground">
          Loading free agent data...
        </div>
      ) : (
        <PendingFreeAgentsDisplay
          teamSummaries={teamSummaries}
          userMap={userMap}
          rosters={rosters}
          players={players}
          leagueTotals={leagueTotals}
          salaryCap={salaryCap}
          teamSalaries={teamSalaries}
        />
      )}
    </ScrollableModal>
  );
});

MinimizablePendingFreeAgents.displayName = 'MinimizablePendingFreeAgents';

export default MinimizablePendingFreeAgents;

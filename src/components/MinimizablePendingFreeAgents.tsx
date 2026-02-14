import React, { memo } from 'react';
import ScrollableModal from './ScrollableModal';
import PendingFreeAgentsDisplay from './PendingFreeAgentsDisplay';
import { usePendingFreeAgents } from '@/hooks/usePendingFreeAgents';
import { Skeleton } from '@/components/ui/skeleton';

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
        <div className="space-y-3 py-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-lg border p-4 space-y-2">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
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

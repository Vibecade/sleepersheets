
import React from 'react';
import { CardContent } from '@/components/ui/card';
import TeamRosterCard from '@/components/TeamRosterCard';

interface TeamRostersGridProps {
  rosters: any[];
  userMap: Record<string, any>;
  showSalaryFeatures: boolean;
  deadCapEnabled: boolean;
  teamSalaries: Record<number, number>;
  teamDeadCaps: Record<number, number>;
  salaryCap: number;
  teamFAAB?: Record<number, { available: number; spent: number; total: number } | number>;
  showFAAB?: boolean;
  canModifyLeague: boolean;
}

const TeamRostersGrid: React.FC<TeamRostersGridProps> = ({
  rosters,
  userMap,
  showSalaryFeatures,
  deadCapEnabled,
  teamSalaries,
  teamDeadCaps,
  salaryCap,
  teamFAAB = {},
  showFAAB = false,
  canModifyLeague
}) => {
  return (
    <CardContent className="pt-0">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3 lg:gap-4 xl:gap-5">
        {rosters.map((roster) => {
          const user = userMap[roster.owner_id];
          const teamSalary = teamSalaries[roster.roster_id] || 0;
          const teamDeadCap = deadCapEnabled ? (teamDeadCaps[roster.roster_id] || 0) : 0;
          const faabBudget = teamFAAB[roster.roster_id] || { available: 0, spent: 0, total: 0 };

          return (
            <TeamRosterCard
              key={roster.roster_id}
              roster={roster}
              user={user}
              showSalaryFeatures={showSalaryFeatures}
              deadCapEnabled={deadCapEnabled}
              teamSalary={teamSalary}
              teamDeadCap={teamDeadCap}
              salaryCap={salaryCap}
              teamFAAB={faabBudget}
              showFAAB={showFAAB}
            />
          );
        })}
      </div>
    </CardContent>
  );
};

export default TeamRostersGrid;

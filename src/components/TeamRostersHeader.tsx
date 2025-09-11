
import React from 'react';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Skull, Calculator, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface TeamRostersHeaderProps {
  showSalaryFeatures: boolean;
  showDeadCapManager: boolean;
  deadCapEnabled: boolean;
  onToggleDeadCapManager: () => void;
  showContractCalculator: boolean;
  onToggleContractCalculator: () => void;
  canModifyLeague: boolean;
}

const TeamRostersHeader: React.FC<TeamRostersHeaderProps> = ({
  showSalaryFeatures,
  showDeadCapManager,
  deadCapEnabled,
  onToggleDeadCapManager,
  showContractCalculator,
  onToggleContractCalculator,
  canModifyLeague
}) => {
  const { user } = useAuth();

  return (
    <CardHeader className="pb-3 sm:pb-4">
      <div className="flex flex-col space-y-3 sm:space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 flex-shrink-0" />
            <div className="min-w-0">
              <CardTitle className="text-lg sm:text-xl">Team Rosters</CardTitle>
              <CardDescription className="text-sm">
                Team overview and roster sizes
                {showSalaryFeatures && ' with salary tracking'}
                {showDeadCapManager && ' and dead cap management'}
                {!canModifyLeague && ' (read-only)'}
              </CardDescription>
            </div>
          </div>
        </div>

        {!canModifyLeague && (
          <div className="flex items-center space-x-2 text-amber-400 text-sm bg-amber-400/10 p-2 rounded">
            <Lock className="w-4 h-4" />
            <span>
              {user ? 'Claim this league to enable editing features' : 'Sign in and claim this league to enable editing features'}
            </span>
          </div>
        )}
        
        <div className="flex flex-col xs:flex-row gap-2">
          {showSalaryFeatures && deadCapEnabled && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleDeadCapManager}
              className="flex items-center justify-center space-x-2 min-h-[44px] text-sm"
              disabled={!canModifyLeague}
              title={!canModifyLeague ? 'Claim this league to access dead cap management' : undefined}
            >
              <Skull className="w-4 h-4" />
              <span>Dynasty Dead Cap</span>
              {!canModifyLeague && <Lock className="w-3 h-3 ml-1" />}
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleContractCalculator}
            className="flex items-center justify-center space-x-2 min-h-[44px] text-sm"
          >
            <Calculator className="w-4 h-4" />
            <span>Contract Calculator</span>
          </Button>
        </div>
      </div>
    </CardHeader>
  );
};

export default TeamRostersHeader;

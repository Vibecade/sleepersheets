
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, DollarSign, Skull, Calculator } from 'lucide-react';
import SalarySettings from '@/components/SalarySettings';

interface TeamRostersHeaderProps {
  showSalaryFeatures: boolean;
  showDeadCapManager: boolean;
  deadCapEnabled: boolean;
  onToggleSalaryFeatures: () => void;
  onToggleDeadCapManager: () => void;
  localSalaryCap: string;
  setLocalSalaryCap: (value: string) => void;
  salaryCap: number;
  onDeadCapEnabledChange: (enabled: boolean) => Promise<void>;
  settingsLoading: boolean;
  onSalaryCapSave: () => Promise<void>;
  showFAAB: boolean;
  onToggleFAAB: () => void;
  showContractCalculator: boolean;
  onToggleContractCalculator: () => void;
}

const TeamRostersHeader: React.FC<TeamRostersHeaderProps> = ({
  showSalaryFeatures,
  showDeadCapManager,
  deadCapEnabled,
  onToggleSalaryFeatures,
  onToggleDeadCapManager,
  localSalaryCap,
  setLocalSalaryCap,
  salaryCap,
  onDeadCapEnabledChange,
  settingsLoading,
  onSalaryCapSave,
  showFAAB,
  onToggleFAAB,
  showContractCalculator,
  onToggleContractCalculator
}) => {
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
                {showFAAB && ' and FAAB budgets'}
              </CardDescription>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col xs:flex-row gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleSalaryFeatures}
            className="flex items-center justify-center space-x-2 min-h-[44px] text-sm"
          >
            <DollarSign className="w-4 h-4" />
            <span>Salary Features</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleFAAB}
            className="flex items-center justify-center space-x-2 min-h-[44px] text-sm"
          >
            <DollarSign className="w-4 h-4" />
            <span>FAAB Budgets</span>
          </Button>
          
          {deadCapEnabled && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleDeadCapManager}
              className="flex items-center justify-center space-x-2 min-h-[44px] text-sm"
            >
              <Skull className="w-4 h-4" />
              <span>Dynasty Dead Cap</span>
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

      {showSalaryFeatures && (
        <div className="pt-3 sm:pt-4 border-t border-white/10">
          <SalarySettings
            localSalaryCap={localSalaryCap}
            setLocalSalaryCap={setLocalSalaryCap}
            salaryCap={salaryCap}
            deadCapEnabled={deadCapEnabled}
            onDeadCapEnabledChange={onDeadCapEnabledChange}
            settingsLoading={settingsLoading}
            onSalaryCapSave={onSalaryCapSave}
          />
        </div>
      )}
    </CardHeader>
  );
};

export default TeamRostersHeader;

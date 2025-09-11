import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SalarySettings from '@/components/SalarySettings';
import FAABSettings from '@/components/FAABSettings';

interface MinimizableLeagueOptionsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showSalaryFeatures: boolean;
  showFAAB: boolean;
  onToggleSalaryFeatures: () => void;
  onToggleFAAB: () => void;
  localSalaryCap: string;
  setLocalSalaryCap: (value: string) => void;
  salaryCap: number;
  deadCapEnabled: boolean;
  onDeadCapEnabledChange: (enabled: boolean) => Promise<void>;
  settingsLoading: boolean;
  onSalaryCapSave: () => Promise<void>;
  faabCap: number;
  reserveLimit: number;
  localFaabCap: string;
  localReserveLimit: string;
  setLocalFaabCap: (value: string) => void;
  setLocalReserveLimit: (value: string) => void;
  onFaabSettingsSave: () => Promise<void>;
  canModifyLeague: boolean;
}

const MinimizableLeagueOptions: React.FC<MinimizableLeagueOptionsProps> = ({
  open,
  onOpenChange,
  showSalaryFeatures,
  showFAAB,
  onToggleSalaryFeatures,
  onToggleFAAB,
  localSalaryCap,
  setLocalSalaryCap,
  salaryCap,
  deadCapEnabled,
  onDeadCapEnabledChange,
  settingsLoading,
  onSalaryCapSave,
  faabCap,
  reserveLimit,
  localFaabCap,
  localReserveLimit,
  setLocalFaabCap,
  setLocalReserveLimit,
  onFaabSettingsSave,
  canModifyLeague,
}) => {
  return (
    <Card>
      <Collapsible open={open} onOpenChange={onOpenChange}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>League Options</span>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-6">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={showSalaryFeatures ? "default" : "outline"}
                size="sm"
                onClick={onToggleSalaryFeatures}
                className="mobile-btn-compact"
              >
                <span className="hidden sm:inline">Salary Features</span>
                <span className="sm:hidden">Salary</span>
              </Button>
              
              <Button
                variant={showFAAB ? "default" : "outline"}
                size="sm"
                onClick={onToggleFAAB}
                className="mobile-btn-compact"
              >
                <span className="hidden sm:inline">FAAB Budget</span>
                <span className="sm:hidden">FAAB</span>
              </Button>
            </div>

            {showSalaryFeatures && (
              <SalarySettings
                localSalaryCap={localSalaryCap}
                setLocalSalaryCap={setLocalSalaryCap}
                salaryCap={salaryCap}
                deadCapEnabled={deadCapEnabled}
                onDeadCapEnabledChange={onDeadCapEnabledChange}
                settingsLoading={settingsLoading}
                onSalaryCapSave={onSalaryCapSave}
                canModifyLeague={canModifyLeague}
              />
            )}

            {showFAAB && (
              <FAABSettings
                faabCap={faabCap}
                reserveLimit={reserveLimit}
                localFaabCap={localFaabCap}
                localReserveLimit={localReserveLimit}
                setLocalFaabCap={setLocalFaabCap}
                setLocalReserveLimit={setLocalReserveLimit}
                onFaabSettingsSave={onFaabSettingsSave}
                settingsLoading={settingsLoading}
                canModifyLeague={canModifyLeague}
              />
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default MinimizableLeagueOptions;
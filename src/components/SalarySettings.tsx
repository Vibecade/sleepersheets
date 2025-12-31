import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Settings, Skull, Save, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

interface SalarySettingsProps {
  localSalaryCap: string;
  setLocalSalaryCap: (value: string) => void;
  salaryCap: number;
  deadCapEnabled: boolean;
  onDeadCapEnabledChange: (enabled: boolean) => Promise<void>;
  settingsLoading: boolean;
  onSalaryCapSave: () => Promise<void>;
  canModifyLeague: boolean;
}

const SalarySettings: React.FC<SalarySettingsProps> = ({
  localSalaryCap,
  setLocalSalaryCap,
  salaryCap,
  deadCapEnabled,
  onDeadCapEnabledChange,
  settingsLoading,
  onSalaryCapSave,
  canModifyLeague
}) => {
  const { toast } = useToast();

  const formatSalary = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  const handleDeadCapChange = async (enabled: boolean) => {
    if (!canModifyLeague) {
      toast({
        title: "Claim Required",
        description: "You must claim this league to modify dead cap settings",
        variant: "destructive"
      });
      return;
    }
    await onDeadCapEnabledChange(enabled);
  };

  const handleSalaryCapSave = async () => {
    if (!canModifyLeague) {
      toast({
        title: "Claim Required",
        description: "You must claim this league to modify salary cap settings",
        variant: "destructive"
      });
      return;
    }
    await onSalaryCapSave();
  };

  if (settingsLoading) return null;

  return (
    <div className="space-y-4 p-3 sm:p-4 bg-white/5 rounded-lg border border-white/10">
      {!canModifyLeague && (
        <div className="flex items-center space-x-2 text-amber-400 text-sm bg-amber-400/10 p-2 rounded">
          <Lock className="w-4 h-4 flex-shrink-0" />
          <span>Claim this league to modify salary settings</span>
        </div>
      )}
      
      <div className="space-y-3">
        <div className="flex flex-col space-y-3">
          <div className="flex items-center space-x-2">
            <Settings className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <label className="text-sm font-medium text-blue-200">Salary Cap:</label>
          </div>
          
          <div className="flex flex-col xs:flex-row items-start xs:items-center space-y-2 xs:space-y-0 xs:space-x-3">
            <div className="flex items-center space-x-2 w-full xs:w-auto">
              <span className="text-sm text-gray-300">$</span>
              <Input
                type="number"
                value={localSalaryCap}
                onChange={(e) => {
                  logger.debug('Salary cap input changed to:', e.target.value);
                  setLocalSalaryCap(e.target.value);
                }}
                className="flex-1 xs:w-32 h-10 bg-white/10 border-white/20 text-white text-base"
                placeholder="200000"
                disabled={!canModifyLeague}
              />
              <Button
                onClick={handleSalaryCapSave}
                size="sm"
                variant="outline"
                className="h-10 px-3 min-w-[80px] whitespace-nowrap"
                disabled={!canModifyLeague}
              >
                <Save className="w-3 h-3 mr-1" />
                Save
              </Button>
            </div>
            
            <Badge variant="outline" className="text-white border-white/20 self-start xs:self-center">
              Cap: {formatSalary(salaryCap)}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div className="flex items-center space-x-2">
            <Skull className="w-4 h-4 text-red-400 flex-shrink-0" />
            <label className="text-sm font-medium text-red-200">Enable Dead Cap:</label>
          </div>
          <Switch
            checked={deadCapEnabled}
            onCheckedChange={handleDeadCapChange}
            disabled={!canModifyLeague}
          />
        </div>
      </div>
    </div>
  );
};

export default SalarySettings;

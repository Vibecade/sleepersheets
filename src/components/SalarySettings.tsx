
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Settings, Skull, Save } from 'lucide-react';

interface SalarySettingsProps {
  localSalaryCap: string;
  setLocalSalaryCap: (value: string) => void;
  salaryCap: number;
  deadCapEnabled: boolean;
  onDeadCapEnabledChange: (enabled: boolean) => Promise<void>;
  settingsLoading: boolean;
  onSalaryCapSave: () => Promise<void>;
}

const SalarySettings: React.FC<SalarySettingsProps> = ({
  localSalaryCap,
  setLocalSalaryCap,
  salaryCap,
  deadCapEnabled,
  onDeadCapEnabledChange,
  settingsLoading,
  onSalaryCapSave
}) => {
  const formatSalary = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  if (settingsLoading) return null;

  return (
    <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center space-x-2">
          <Settings className="w-4 h-4 text-blue-400" />
          <label className="text-sm font-medium text-blue-200">Salary Cap:</label>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-300">$</span>
          <Input
            type="number"
            value={localSalaryCap}
            onChange={(e) => {
              console.log('Salary cap input changed to:', e.target.value);
              setLocalSalaryCap(e.target.value);
            }}
            className="w-32 h-8 bg-white/10 border-white/20 text-white"
            placeholder="200000"
          />
          <Button
            onClick={onSalaryCapSave}
            size="sm"
            variant="outline"
            className="h-8 px-3"
          >
            <Save className="w-3 h-3 mr-1" />
            Save
          </Button>
        </div>
        <Badge variant="outline" className="text-white border-white/20">
          Cap: {formatSalary(salaryCap)}
        </Badge>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Skull className="w-4 h-4 text-red-400" />
          <label className="text-sm font-medium text-red-200">Enable Dead Cap:</label>
        </div>
        <Switch
          checked={deadCapEnabled}
          onCheckedChange={onDeadCapEnabledChange}
        />
      </div>
    </div>
  );
};

export default SalarySettings;

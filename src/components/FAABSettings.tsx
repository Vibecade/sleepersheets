
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2, Lock } from 'lucide-react';

interface FAABSettingsProps {
  faabCap: number;
  reserveLimit: number;
  localFaabCap: string;
  localReserveLimit: string;
  setLocalFaabCap: (value: string) => void;
  setLocalReserveLimit: (value: string) => void;
  onFaabSettingsSave: () => Promise<void>;
  settingsLoading: boolean;
  canModifyLeague: boolean;
}

const FAABSettings: React.FC<FAABSettingsProps> = ({
  faabCap,
  reserveLimit,
  localFaabCap,
  localReserveLimit,
  setLocalFaabCap,
  setLocalReserveLimit,
  onFaabSettingsSave,
  settingsLoading,
  canModifyLeague
}) => {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h4 className="text-sm font-medium">FAAB Configuration</h4>
        <Separator className="bg-white/10" />
        
        {!canModifyLeague && (
          <div className="flex items-center space-x-2 text-amber-400 text-sm bg-amber-400/10 p-2 rounded">
            <Lock className="w-4 h-4" />
            <span>Claim this league to modify FAAB settings</span>
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="faab-cap" className="text-xs text-gray-300">
              Maximum FAAB Budget
            </Label>
            <Input
              id="faab-cap"
              type="number"
              value={localFaabCap}
              onChange={(e) => setLocalFaabCap(e.target.value)}
              placeholder="100"
              disabled={!canModifyLeague}
              className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 text-sm disabled:opacity-50"
            />
            <p className="text-xs text-gray-400">
              Maximum FAAB budget per team (typically 100)
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reserve-limit" className="text-xs text-gray-300">
              Reserve Limit
            </Label>
            <Input
              id="reserve-limit"
              type="number"
              value={localReserveLimit}
              onChange={(e) => setLocalReserveLimit(e.target.value)}
              placeholder="100"
              disabled={!canModifyLeague}
              className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 text-sm disabled:opacity-50"
            />
            <p className="text-xs text-gray-400">
              Amount reserved from salary cap for FAAB calculations
            </p>
          </div>
        </div>
        
        <div className="bg-gray-800/30 p-3 rounded-lg">
          <p className="text-xs text-gray-300 mb-1">
            <strong>FAAB Calculation:</strong>
          </p>
          <p className="text-xs text-gray-400">
            Available FAAB = min(Salary Cap - Total Team Salary, Maximum FAAB Budget)
          </p>
        </div>
        
        <Button 
          onClick={onFaabSettingsSave}
          disabled={settingsLoading || !canModifyLeague}
          size="sm"
          className="w-full sm:w-auto"
        >
          {settingsLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save FAAB Settings'
          )}
          {!canModifyLeague && <Lock className="w-3 h-3 ml-1" />}
        </Button>
      </div>
    </div>
  );
};

export default FAABSettings;

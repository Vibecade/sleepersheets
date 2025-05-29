
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Truck } from 'lucide-react';

interface TaxiSquadToggleProps {
  playerId: string;
  currentStatus: boolean;
  onToggle: (playerId: string, taxiSquad: boolean) => Promise<boolean>;
  disabled?: boolean;
}

const TaxiSquadToggle: React.FC<TaxiSquadToggleProps> = ({
  playerId,
  currentStatus,
  onToggle,
  disabled = false
}) => {
  const handleToggle = async (checked: boolean) => {
    await onToggle(playerId, checked);
  };

  return (
    <div className="flex items-center space-x-2">
      <Switch
        id={`taxi-${playerId}`}
        checked={currentStatus}
        onCheckedChange={handleToggle}
        disabled={disabled}
      />
      <Label htmlFor={`taxi-${playerId}`} className="flex items-center space-x-1 cursor-pointer">
        <Truck className="w-3 h-3" />
        <span className="text-xs">Taxi Squad</span>
      </Label>
      {currentStatus && (
        <span className="text-xs text-amber-400 font-medium">
          (25% salary)
        </span>
      )}
    </div>
  );
};

export default TaxiSquadToggle;

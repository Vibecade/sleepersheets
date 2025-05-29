
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Truck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();

  const handleToggle = async (checked: boolean) => {
    if (!user) return; // Prevent changes when not authenticated
    await onToggle(playerId, checked);
  };

  const isDisabled = disabled || !user;

  return (
    <div className="flex items-center space-x-2">
      <Switch
        id={`taxi-${playerId}`}
        checked={currentStatus}
        onCheckedChange={handleToggle}
        disabled={isDisabled}
      />
      <Label 
        htmlFor={`taxi-${playerId}`} 
        className={`flex items-center space-x-1 ${user ? 'cursor-pointer' : 'cursor-default opacity-75'}`}
        title={!user ? 'Sign in to modify taxi squad' : undefined}
      >
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


import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, X, Edit } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLeagueOwnership } from '@/hooks/useLeagueOwnership';
import { useFAABCalculations } from '@/hooks/useFAABCalculations';

interface EditableContractLengthProps {
  playerId: string;
  currentLength: number | null;
  onContractUpdate: (playerId: string, contractLength: number | null) => Promise<boolean>;
  leagueId: string;
  rosterId?: number;
}

const EditableContractLength: React.FC<EditableContractLengthProps> = ({
  playerId,
  currentLength,
  onContractUpdate,
  leagueId,
  rosterId
}) => {
  const { user } = useAuth();
  const { canModifyLeague } = useLeagueOwnership();
  const { isPlayerFAABAcquisition } = useFAABCalculations({ rosters: [], leagueId });
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(currentLength?.toString() || '');
  const [isLoading, setIsLoading] = useState(false);

  const canModify = canModifyLeague(leagueId);
  const isFAABPlayer = rosterId ? isPlayerFAABAcquisition(playerId, rosterId) : false;

  // Debug logging
  React.useEffect(() => {
    if (currentLength !== null && currentLength !== undefined) {
      console.log(`📋 Contract display for ${playerId}:`, {
        currentLength,
        canModify,
        isFAABPlayer,
        rosterId
      });
    }
  }, [playerId, currentLength, canModify, isFAABPlayer, rosterId]);

  const handleSave = async () => {
    if (!canModify) return;
    
    setIsLoading(true);
    const contractLength = tempValue === '' ? null : Number(tempValue);
    const success = await onContractUpdate(playerId, contractLength);
    
    if (success) {
      setIsEditing(false);
    }
    setIsLoading(false);
  };

  const handleCancel = () => {
    setTempValue(currentLength?.toString() || '');
    setIsEditing(false);
  };

  const handleEdit = () => {
    if (!canModify || isFAABPlayer) return;
    setTempValue(currentLength?.toString() || '');
    setIsEditing(true);
  };

  if (!isEditing) {
    if (isFAABPlayer) {
      return (
        <div className="flex items-center space-x-1 px-2 py-1 opacity-75">
          <span className="text-orange-400 text-sm">FAAB Player</span>
        </div>
      );
    }

    return (
      <div 
        className={`flex items-center space-x-1 px-2 py-1 transition-colors rounded ${
          canModify ? 'cursor-pointer hover:bg-white/10' : 'cursor-default opacity-75'
        }`}
        onClick={handleEdit}
        title={!canModify ? 'Claim this league to edit contracts' : undefined}
      >
        <span className="text-gray-300 text-sm">
          {currentLength ? `${currentLength} yr${currentLength !== 1 ? 's' : ''}` : (canModify ? 'Set contract' : 'No contract')}
        </span>
        {canModify && <Edit className="w-3 h-3 text-gray-400" />}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-1">
      <Input
        type="number"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        className="w-16 h-7 text-xs bg-white/10 border-white/20 text-white"
        placeholder="0"
        min="0"
        max="10"
        autoFocus
      />
      <Button
        size="sm"
        variant="ghost"
        onClick={handleSave}
        disabled={isLoading}
        className="h-7 w-7 p-0 hover:bg-green-500/20"
      >
        <Check className="w-3 h-3 text-green-400" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleCancel}
        className="h-7 w-7 p-0 hover:bg-red-500/20"
      >
        <X className="w-3 h-3 text-red-400" />
      </Button>
    </div>
  );
};

export default EditableContractLength;

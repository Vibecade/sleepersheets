import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, X, Edit } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLeagueOwnership } from '@/hooks/useLeagueOwnership';
import { useToast } from '@/hooks/use-toast';

interface EditableSalaryProps {
  playerId: string;
  currentSalary: number | null;
  onSalaryUpdate: (playerId: string, salary: number | null) => Promise<boolean>;
  leagueId: string;
}

const EditableSalary: React.FC<EditableSalaryProps> = ({
  playerId,
  currentSalary,
  onSalaryUpdate,
  leagueId
}) => {
  const { user } = useAuth();
  const { canModifyLeague } = useLeagueOwnership();
  const { toast } = useToast();
  const [value, setValue] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState(false);

  const canModify = canModifyLeague(leagueId);

  useEffect(() => {
    setValue(currentSalary ? currentSalary.toString() : '');
  }, [currentSalary]);

  const handleSave = useCallback(async () => {
    if (!canModify || isSaving) return;
    
    setIsSaving(true);
    const numericValue = value.trim() === '' ? null : parseFloat(value);
    
    if (value.trim() !== '' && (isNaN(numericValue!) || numericValue! < 0)) {
      setValue(currentSalary ? currentSalary.toString() : '');
      setIsEditing(false);
      setIsSaving(false);
      return;
    }
    )
    )

    try {
      const success = await onSalaryUpdate(playerId, numericValue);
      if (success) {
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error saving salary:', error);
      setValue(currentSalary ? currentSalary.toString() : '');
    } finally {
      setIsSaving(false);
    }
  }, [playerId, value, currentSalary, onSalaryUpdate, canModify, isSaving]);
  )

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setValue(currentSalary ? currentSalary.toString() : '');
      setIsEditing(false);
    }
  }, [handleSave, currentSalary]);

  const handleEditToggle = useCallback(() => {
    if (!canModify || isSaving) return;
    setIsEditing(true);
  }, [canModify, isSaving]);

  const formatDisplayValue = useMemo(() => {
    if (currentSalary === null || currentSalary === undefined) {
      return canModify ? 'Click to edit' : 'No salary set';
    }
    return `$${currentSalary.toLocaleString()}`;
  }, [currentSalary, canModify]);

  if (isEditing && canModify) {
    return (
      <div className="flex items-center space-x-1">
        <Input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter salary"
          disabled={isSaving}
          className="w-28 h-8 text-xs bg-white text-black border-2 border-blue-400"
          aria-label="Player salary"
          autoFocus
          id={`salary-input-${playerId}`}
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          disabled={isSaving}
          className="h-7 w-7 p-0 hover:bg-green-500/20"
          aria-label="Save salary"
        >
          <Check className="w-3 h-3 text-green-400" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setValue(currentSalary ? currentSalary.toString() : '');
            setIsEditing(false);
          }}
          className="h-7 w-7 p-0 hover:bg-red-500/20"
          aria-label="Cancel editing"
        >
          <X className="w-3 h-3 text-red-400" />
        </Button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleEditToggle}
      className={`text-emerald-300 transition-colors text-xs p-1 border border-transparent rounded min-w-[100px] text-left ${
        canModify ? 'hover:text-emerald-100 cursor-pointer hover:border-emerald-400/50' : 'cursor-default opacity-75'
      }`}
      disabled={isSaving || !canModify}
      title={!canModify ? 'Claim this league to edit salaries' : 'Click to edit salary'}
      aria-label={`${formatDisplayValue} - ${!canModify ? 'Claim this league to edit salaries' : 'Click to edit salary'}`}
      aria-haspopup="true"
      aria-expanded={isEditing}
    >
      <span className="flex items-center">
        {isSaving ? 'Saving...' : formatDisplayValue}
        {canModify && !isSaving && <Edit className="w-3 h-3 ml-1 text-emerald-400/50" />}
      </span>
    </button>
  );
};

export default React.memo(EditableSalary);
}
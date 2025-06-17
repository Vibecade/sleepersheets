import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useLeagueOwnership } from '@/hooks/useLeagueOwnership';
import { useAchievements } from '@/hooks/useAchievements';

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
  const { trackSalaryUpdate } = useAchievements(leagueId);
  const [value, setValue] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const canModify = canModifyLeague(leagueId);

  useEffect(() => {
    setValue(currentSalary ? currentSalary.toString() : '');
  }, [currentSalary]);

  const handleSave = useCallback(async () => {
    if (!canModify) return;
    
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
        // Track salary update for achievements
        trackSalaryUpdate();
      }
    } catch (error) {
      console.error('Error saving salary:', error);
      setValue(currentSalary ? currentSalary.toString() : '');
    } finally {
      setIsSaving(false);
    }
  }, [playerId, value, currentSalary, onSalaryUpdate, canModify, trackSalaryUpdate]);
  )

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setValue(currentSalary ? currentSalary.toString() : '');
      setIsEditing(false);
    }
  }, [handleSave, currentSalary]);

  const handleEditToggle = useCallback(() => {
    if (!canModify) return;
    setIsEditing(true);
  }, [canModify]);

  const formatDisplayValue = useMemo(() => {
    if (currentSalary === null || currentSalary === undefined) {
      return canModify ? 'Click to edit' : 'No salary set';
    }
    return `$${currentSalary.toLocaleString()}`;
  }, [currentSalary, canModify]);

  if (isEditing && canModify) {
    return (
      <Input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyPress}
        placeholder="Enter salary"
        disabled={isSaving}
        className="w-28 h-8 text-xs bg-white text-black border-2 border-blue-400"
        autoFocus
      />
    );
  }

  return (
    <button
      onClick={handleEditToggle}
      className={`text-emerald-300 transition-colors text-xs p-1 border border-transparent rounded min-w-[100px] text-left ${
        canModify ? 'hover:text-emerald-100 cursor-pointer hover:border-emerald-400/50' : 'cursor-default opacity-75'
      }`}
      disabled={isSaving || !canModify}
      title={!canModify ? 'Claim this league to edit salaries' : undefined}
    >
      {isSaving ? 'Saving...' : formatDisplayValue}
    </button>
  );
};

export default React.memo(EditableSalary);
}
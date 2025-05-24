
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';

interface EditableSalaryProps {
  playerId: string;
  currentSalary: number | null;
  onSalaryUpdate: (playerId: string, salary: number | null) => Promise<boolean>;
}

const EditableSalary: React.FC<EditableSalaryProps> = ({
  playerId,
  currentSalary,
  onSalaryUpdate
}) => {
  const [value, setValue] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setValue(currentSalary ? currentSalary.toString() : '');
  }, [currentSalary]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    const numericValue = value.trim() === '' ? null : parseFloat(value);
    
    if (value.trim() !== '' && (isNaN(numericValue!) || numericValue! < 0)) {
      setValue(currentSalary ? currentSalary.toString() : '');
      setIsEditing(false);
      setIsSaving(false);
      return;
    }

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
  }, [playerId, value, currentSalary, onSalaryUpdate]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setValue(currentSalary ? currentSalary.toString() : '');
      setIsEditing(false);
    }
  }, [handleSave, currentSalary]);

  const handleEditToggle = useCallback(() => {
    setIsEditing(true);
  }, []);

  const formatDisplayValue = useMemo(() => {
    if (currentSalary === null || currentSalary === undefined) return 'Click to edit';
    return `$${currentSalary.toLocaleString()}`;
  }, [currentSalary]);

  if (isEditing) {
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
      className="text-emerald-300 hover:text-emerald-100 transition-colors cursor-pointer text-xs p-1 border border-transparent hover:border-emerald-400/50 rounded min-w-[100px] text-left"
      disabled={isSaving}
    >
      {isSaving ? 'Saving...' : formatDisplayValue}
    </button>
  );
};

export default React.memo(EditableSalary);

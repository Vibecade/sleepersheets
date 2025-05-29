
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();
  const [value, setValue] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setValue(currentSalary ? currentSalary.toString() : '');
  }, [currentSalary]);

  const handleSave = useCallback(async () => {
    if (!user) return; // Prevent saving when not authenticated
    
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
  }, [playerId, value, currentSalary, onSalaryUpdate, user]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setValue(currentSalary ? currentSalary.toString() : '');
      setIsEditing(false);
    }
  }, [handleSave, currentSalary]);

  const handleEditToggle = useCallback(() => {
    if (!user) return; // Prevent editing when not authenticated
    setIsEditing(true);
  }, [user]);

  const formatDisplayValue = useMemo(() => {
    if (currentSalary === null || currentSalary === undefined) {
      return user ? 'Click to edit' : 'No salary set';
    }
    return `$${currentSalary.toLocaleString()}`;
  }, [currentSalary, user]);

  if (isEditing && user) {
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
        user ? 'hover:text-emerald-100 cursor-pointer hover:border-emerald-400/50' : 'cursor-default opacity-75'
      }`}
      disabled={isSaving || !user}
      title={!user ? 'Sign in to edit salaries' : undefined}
    >
      {isSaving ? 'Saving...' : formatDisplayValue}
    </button>
  );
};

export default React.memo(EditableSalary);


import React, { useState, useEffect } from 'react';
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

  const handleSave = async () => {
    setIsSaving(true);
    const numericValue = value.trim() === '' ? null : parseFloat(value);
    
    if (value.trim() !== '' && (isNaN(numericValue!) || numericValue! < 0)) {
      setValue(currentSalary ? currentSalary.toString() : '');
      setIsEditing(false);
      setIsSaving(false);
      return;
    }

    const success = await onSalaryUpdate(playerId, numericValue);
    if (success) {
      setIsEditing(false);
    }
    setIsSaving(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setValue(currentSalary ? currentSalary.toString() : '');
      setIsEditing(false);
    }
  };

  const formatDisplayValue = (salary: number | null) => {
    if (salary === null || salary === undefined) return '-';
    return `$${salary.toLocaleString()}`;
  };

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
        className="w-24 h-8 text-xs"
        autoFocus
      />
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="text-white hover:text-emerald-300 transition-colors cursor-pointer text-xs"
      disabled={isSaving}
    >
      {isSaving ? '...' : formatDisplayValue(currentSalary)}
    </button>
  );
};

export default EditableSalary;

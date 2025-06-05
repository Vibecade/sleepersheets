
import { validateLeagueId, validateUsername, sanitizeInput } from './inputValidation';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedValue?: string;
}

export const validateAndSanitizeLeagueId = (input: string): ValidationResult => {
  const sanitized = sanitizeInput(input);
  const isValid = validateLeagueId(sanitized);
  
  if (!isValid) {
    return {
      isValid: false,
      error: 'League ID must be at least 10 characters long and contain only alphanumeric characters'
    };
  }
  
  return {
    isValid: true,
    sanitizedValue: sanitized
  };
};

export const validateAndSanitizeUsername = (input: string): ValidationResult => {
  const sanitized = sanitizeInput(input);
  const isValid = validateUsername(sanitized);
  
  if (!isValid) {
    return {
      isValid: false,
      error: 'Username must be 3-20 characters long and contain only letters, numbers, and underscores'
    };
  }
  
  return {
    isValid: true,
    sanitizedValue: sanitized
  };
};

export const validateSalary = (input: string | number): ValidationResult => {
  const numValue = typeof input === 'string' ? parseFloat(input) : input;
  
  if (isNaN(numValue) || numValue < 0) {
    return {
      isValid: false,
      error: 'Salary must be a non-negative number'
    };
  }
  
  if (numValue > 10000000) { // 10M cap for sanity
    return {
      isValid: false,
      error: 'Salary cannot exceed $10,000,000'
    };
  }
  
  return {
    isValid: true,
    sanitizedValue: numValue.toString()
  };
};

export const validateContractLength = (input: string | number): ValidationResult => {
  const numValue = typeof input === 'string' ? parseInt(input) : input;
  
  if (isNaN(numValue) || numValue < 1 || numValue > 10) {
    return {
      isValid: false,
      error: 'Contract length must be between 1 and 10 years'
    };
  }
  
  return {
    isValid: true,
    sanitizedValue: numValue.toString()
  };
};

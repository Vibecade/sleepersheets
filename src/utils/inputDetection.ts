import { validateLeagueId, validateUsername } from '@/utils/inputValidation';

export type InputType = 'league-id' | 'username' | 'unknown';

export interface InputDetectionResult {
  type: InputType;
  confidence: 'high' | 'medium' | 'low';
  hint: string;
}

/**
 * Detects whether input appears to be a League ID or Username
 */
export const detectInputType = (input: string): InputDetectionResult => {
  const trimmed = input.trim();
  
  if (!trimmed) {
    return {
      type: 'unknown',
      confidence: 'low',
      hint: 'Enter your League ID (numbers) or Username (letters/numbers)'
    };
  }

  // Check if it's all numbers (League ID pattern)
  const isAllNumbers = /^\d+$/.test(trimmed);
  
  // Check League ID validation
  const leagueIdValidation = validateLeagueId(trimmed);
  
  // Check Username validation
  const usernameValidation = validateUsername(trimmed);
  
  // High confidence League ID
  if (isAllNumbers && leagueIdValidation.isValid) {
    return {
      type: 'league-id',
      confidence: 'high',
      hint: '✓ Looks like a League ID'
    };
  }
  
  // High confidence Username
  if (!isAllNumbers && usernameValidation.isValid && trimmed.length >= 3) {
    return {
      type: 'username',
      confidence: 'high',
      hint: '✓ Looks like a Username'
    };
  }
  
  // Medium confidence League ID (numbers but maybe wrong length)
  if (isAllNumbers && trimmed.length > 10) {
    return {
      type: 'league-id',
      confidence: 'medium',
      hint: '? Might be a League ID (check the length)'
    };
  }
  
  // Medium confidence Username (contains letters/numbers)
  if (/^[a-zA-Z0-9_-]+$/.test(trimmed) && trimmed.length >= 2) {
    return {
      type: 'username',
      confidence: 'medium',
      hint: '? Might be a Username'
    };
  }
  
  // Low confidence - doesn't match expected patterns
  return {
    type: 'unknown',
    confidence: 'low',
    hint: 'Enter a League ID (15-20 digits) or Username (3-20 characters)'
  };
};

/**
 * Gets appropriate placeholder text based on detected input type
 */
export const getPlaceholderText = (detectionResult: InputDetectionResult): string => {
  switch (detectionResult.type) {
    case 'league-id':
      return 'League ID (e.g., 123456789012345)';
    case 'username':
      return 'Username (e.g., your_sleeper_username)';
    default:
      return 'League ID or Username';
  }
};
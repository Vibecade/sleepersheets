
import DOMPurify from 'isomorphic-dompurify';

// Input sanitization
export const sanitizeInput = (input: string): string => {
  // Remove any HTML tags and potential XSS vectors
  return DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [], 
    ALLOWED_ATTR: [] 
  }).trim();
};

// League ID validation
export const validateLeagueId = (leagueId: string): { isValid: boolean; error?: string } => {
  const sanitized = sanitizeInput(leagueId);
  
  if (!sanitized) {
    return { isValid: false, error: 'League ID is required' };
  }
  
  // Sleeper league IDs are typically 18 characters long and numeric
  if (!/^\d{15,20}$/.test(sanitized)) {
    return { isValid: false, error: 'League ID must be 15-20 digits' };
  }
  
  return { isValid: true };
};

// Username validation
export const validateUsername = (username: string): { isValid: boolean; error?: string } => {
  const sanitized = sanitizeInput(username);
  
  if (!sanitized) {
    return { isValid: false, error: 'Username is required' };
  }
  
  // Sleeper usernames: 3-20 characters, alphanumeric and underscores
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(sanitized)) {
    return { isValid: false, error: 'Username must be 3-20 characters (letters, numbers, underscores only)' };
  }
  
  return { isValid: true };
};

// Salary validation
export const validateSalary = (salary: string | number): { isValid: boolean; error?: string; value?: number } => {
  const numValue = typeof salary === 'string' ? parseFloat(salary) : salary;
  
  if (isNaN(numValue)) {
    return { isValid: false, error: 'Salary must be a valid number' };
  }
  
  if (numValue < 0) {
    return { isValid: false, error: 'Salary cannot be negative' };
  }
  
  if (numValue > 10000000) { // 10M cap for sanity
    return { isValid: false, error: 'Salary cannot exceed $10,000,000' };
  }
  
  return { isValid: true, value: numValue };
};

// Enhanced validation functions with sanitization (consolidated from enhancedInputValidation)
export const validateAndSanitizeLeagueId = (input: string): { isValid: boolean; error?: string; sanitizedValue?: string } => {
  const sanitized = sanitizeInput(input);
  const validation = validateLeagueId(sanitized);
  
  if (!validation.isValid) {
    return {
      isValid: false,
      error: validation.error || 'League ID must be 15-20 digits'
    };
  }
  
  return {
    isValid: true,
    sanitizedValue: sanitized
  };
};

export const validateAndSanitizeUsername = (input: string): { isValid: boolean; error?: string; sanitizedValue?: string } => {
  const sanitized = sanitizeInput(input);
  const validation = validateUsername(sanitized);
  
  if (!validation.isValid) {
    return {
      isValid: false,
      error: validation.error || 'Username must be 3-20 characters (letters, numbers, underscores only)'
    };
  }
  
  return {
    isValid: true,
    sanitizedValue: sanitized
  };
};

// Contract length validation
export const validateContractLength = (length: string | number): { isValid: boolean; error?: string; value?: number } => {
  const numValue = typeof length === 'string' ? parseInt(length) : length;
  
  if (isNaN(numValue)) {
    return { isValid: false, error: 'Contract length must be a valid number' };
  }
  
  if (numValue < 1) {
    return { isValid: false, error: 'Contract length must be at least 1 year' };
  }
  
  if (numValue > 10) {
    return { isValid: false, error: 'Contract length cannot exceed 10 years' };
  }
  
  return { isValid: true, value: numValue };
};

// Generic number validation with range
export const validateNumber = (
  value: string | number,
  min?: number,
  max?: number,
  fieldName = 'Value'
): { isValid: boolean; error?: string; value?: number } => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return { isValid: false, error: `${fieldName} must be a valid number` };
  }
  
  if (min !== undefined && numValue < min) {
    return { isValid: false, error: `${fieldName} must be at least ${min}` };
  }
  
  if (max !== undefined && numValue > max) {
    return { isValid: false, error: `${fieldName} cannot exceed ${max}` };
  }
  
  return { isValid: true, value: numValue };
};

// Rate limiting helper
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits = new Map<string, RateLimitEntry>();
  
  isAllowed(key: string, maxRequests = 10, windowMs = 60000): boolean {
    const now = Date.now();
    const entry = this.limits.get(key);
    
    if (!entry || now > entry.resetTime) {
      this.limits.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (entry.count >= maxRequests) {
      return false;
    }
    
    entry.count++;
    return true;
  }
  
  getRemainingRequests(key: string, maxRequests = 10): number {
    const entry = this.limits.get(key);
    if (!entry || Date.now() > entry.resetTime) {
      return maxRequests;
    }
    return Math.max(0, maxRequests - entry.count);
  }
}

export const rateLimiter = new RateLimiter();

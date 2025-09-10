import { PostgrestError } from '@supabase/supabase-js';
import { dataIntegrityService } from './dataIntegrityService';

interface ErrorContext {
  table?: string;
  operation?: string;
  leagueId?: string;
  userId?: string;
}

class SupabaseErrorHandler {
  private static instance: SupabaseErrorHandler;

  static getInstance(): SupabaseErrorHandler {
    if (!SupabaseErrorHandler.instance) {
      SupabaseErrorHandler.instance = new SupabaseErrorHandler();
    }
    return SupabaseErrorHandler.instance;
  }

  // Main error handler for Supabase operations
  async handleError(error: PostgrestError | Error, context: ErrorContext = {}): Promise<void> {
    if (this.isRLSViolation(error)) {
      await this.handleRLSViolation(error, context);
    } else if (this.isLeagueNotFound(error)) {
      await this.handleLeagueNotFound(error, context);
    } else {
      console.error('Supabase error:', error, 'Context:', context);
    }
  }

  // Check if error is an RLS violation
  private isRLSViolation(error: any): boolean {
    return error?.message?.includes('row-level security policy') ||
           error?.code === '42501' ||
           error?.message?.includes('violates row-level security');
  }

  // Check if error indicates league not found
  private isLeagueNotFound(error: any): boolean {
    return error?.message?.includes('League ID') && 
           error?.message?.includes('not found');
  }

  // Handle RLS policy violations
  private async handleRLSViolation(error: any, context: ErrorContext): Promise<void> {
    console.warn('RLS Violation detected:', error.message, 'Context:', context);

    if (context.table && context.operation && context.leagueId) {
      await dataIntegrityService.logRLSViolation({
        table: context.table,
        operation: context.operation,
        leagueId: context.leagueId,
        userId: context.userId,
        error: error.message
      });
    }
  }

  // Handle league not found errors
  private async handleLeagueNotFound(error: any, context: ErrorContext): Promise<void> {
    console.warn('League not found:', error.message, 'Context:', context);

    if (context.leagueId) {
      // Log to integrity system
      // This would be handled by the database trigger
    }
  }

  // Enhanced error wrapper for common Supabase operations
  async wrapOperation<T>(
    operation: () => Promise<{ data: T | null; error: PostgrestError | null }>,
    context: ErrorContext
  ): Promise<{ data: T | null; error: PostgrestError | null }> {
    try {
      const result = await operation();
      
      if (result.error) {
        await this.handleError(result.error, context);
      }
      
      return result;
    } catch (error) {
      await this.handleError(error as Error, context);
      throw error;
    }
  }
}

export const supabaseErrorHandler = SupabaseErrorHandler.getInstance();

// Helper function to wrap Supabase queries with error handling
export const withErrorHandling = <T>(
  operation: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  context: ErrorContext
) => {
  return supabaseErrorHandler.wrapOperation(operation, context);
};
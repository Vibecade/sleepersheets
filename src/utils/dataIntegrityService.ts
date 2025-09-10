import { supabase } from '@/integrations/supabase/client';
import { logRLSViolation, logLeagueIntegrityCheck } from './securityLogger';

interface DataIntegrityCheck {
  leagueId: string;
  checkType: string;
  passed: boolean;
  details?: Record<string, any>;
}

interface RLSViolationData {
  table: string;
  operation: string;
  leagueId: string;
  userId?: string;
  error: string;
}

class DataIntegrityService {
  private static instance: DataIntegrityService;
  private violationQueue: RLSViolationData[] = [];
  private processingQueue = false;

  static getInstance(): DataIntegrityService {
    if (!DataIntegrityService.instance) {
      DataIntegrityService.instance = new DataIntegrityService();
    }
    return DataIntegrityService.instance;
  }

  // Log RLS violations with context
  async logRLSViolation(data: RLSViolationData): Promise<void> {
    this.violationQueue.push(data);
    
    // Log to security logger immediately
    logRLSViolation(data.userId, data.table, data.operation, data.leagueId, {
      error: data.error,
      queue_size: this.violationQueue.length
    });

    // Process queue if not already processing
    if (!this.processingQueue) {
      this.processViolationQueue();
    }
  }

  // Process queued violations and store in database
  private async processViolationQueue(): Promise<void> {
    if (this.processingQueue || this.violationQueue.length === 0) return;
    
    this.processingQueue = true;
    
    try {
      const violations = [...this.violationQueue];
      this.violationQueue = [];

      const logEntries = violations.map(violation => ({
        league_id: violation.leagueId,
        table_name: violation.table,
        operation_type: violation.operation,
        violation_type: 'rls_violation',
        user_id: violation.userId,
        details: {
          error: violation.error,
          timestamp: new Date().toISOString()
        }
      }));

      const { error } = await supabase
        .from('data_integrity_logs')
        .insert(logEntries);

      if (error) {
        console.error('Failed to log RLS violations to database:', error);
        // Re-queue violations for retry
        this.violationQueue.unshift(...violations);
      }

    } catch (error) {
      console.error('Error processing violation queue:', error);
    } finally {
      this.processingQueue = false;
      
      // Process any new violations that came in during processing
      if (this.violationQueue.length > 0) {
        setTimeout(() => this.processViolationQueue(), 1000);
      }
    }
  }

  // Run comprehensive integrity checks for a league
  async runIntegrityChecks(leagueId: string): Promise<DataIntegrityCheck[]> {
    const checks: DataIntegrityCheck[] = [];

    try {
      // Check 1: Verify league metadata exists
      const { data: metadata, error: metadataError } = await supabase
        .from('league_metadata')
        .select('*')
        .eq('league_id', leagueId)
        .single();

      checks.push({
        leagueId,
        checkType: 'metadata_exists',
        passed: !metadataError && !!metadata,
        details: metadataError ? { error: metadataError.message } : undefined
      });

      // Check 2: Verify league ownership is properly configured
      const { data: ownership, error: ownershipError } = await supabase
        .from('league_ownership')
        .select('*')
        .eq('league_id', leagueId)
        .eq('is_active', true);

      checks.push({
        leagueId,
        checkType: 'ownership_configured',
        passed: !ownershipError && !!ownership && ownership.length > 0,
        details: {
          owner_count: ownership?.length || 0,
          error: ownershipError?.message
        }
      });

      // Check 3: Verify no orphaned data
      const tableChecks = [
        { name: 'player_salaries' as const },
        { name: 'player_contracts' as const },
        { name: 'dead_cap_players' as const }
      ];
      
      for (const tableInfo of tableChecks) {
        const { count, error: countError } = await supabase
          .from(tableInfo.name)
          .select('*', { count: 'exact', head: true })
          .eq('league_id', leagueId);

        checks.push({
          leagueId,
          checkType: `${tableInfo.name}_count`,
          passed: !countError,
          details: {
            count: count || 0,
            error: countError?.message
          }
        });
      }

      // Check 4: Verify recent RLS violations
      const { data: violations, error: violationsError } = await supabase
        .from('data_integrity_logs')
        .select('*')
        .eq('league_id', leagueId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      checks.push({
        leagueId,
        checkType: 'recent_violations',
        passed: !violationsError && (!violations || violations.length === 0),
        details: {
          violation_count: violations?.length || 0,
          error: violationsError?.message
        }
      });

      // Log overall integrity check result
      const allPassed = checks.every(check => check.passed);
      logLeagueIntegrityCheck(leagueId, 'comprehensive_check', allPassed, {
        total_checks: checks.length,
        passed_checks: checks.filter(c => c.passed).length,
        failed_checks: checks.filter(c => !c.passed).length
      });

    } catch (error) {
      console.error('Error running integrity checks:', error);
      checks.push({
        leagueId,
        checkType: 'check_error',
        passed: false,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }

    return checks;
  }

  // Get integrity statistics for monitoring
  async getIntegrityStats(): Promise<any> {
    try {
      const { data: violations, error } = await supabase
        .from('data_integrity_logs')
        .select('*')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const stats = {
        total_violations: violations?.length || 0,
        rls_violations: violations?.filter(v => v.violation_type === 'rls_violation').length || 0,
        league_not_found: violations?.filter(v => v.violation_type === 'league_not_found').length || 0,
        affected_leagues: new Set(violations?.map(v => v.league_id)).size || 0,
        violation_types: violations?.reduce((acc: Record<string, number>, v) => {
          acc[v.violation_type] = (acc[v.violation_type] || 0) + 1;
          return acc;
        }, {}) || {}
      };

      return stats;

    } catch (error) {
      console.error('Error getting integrity stats:', error);
      return null;
    }
  }
}

export const dataIntegrityService = DataIntegrityService.getInstance();
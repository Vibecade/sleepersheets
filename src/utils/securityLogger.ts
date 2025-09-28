interface SecurityLogEntry {
  timestamp: Date;
  userId?: string;
  action: string;
  resource: string;
  details?: Record<string, any>;
  success: boolean;
  ipAddress?: string;
}

class SecurityLogger {
  private logs: SecurityLogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory

  log(entry: Omit<SecurityLogEntry, 'timestamp'>) {
    const logEntry: SecurityLogEntry = {
      ...entry,
      timestamp: new Date()
    };

    this.logs.unshift(logEntry);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Security Log:', logEntry);
    }

    // In production, you could send to external logging service
    // this.sendToExternalService(logEntry);
  }

  logLeagueAccess(userId: string | undefined, leagueId: string, action: string, success: boolean) {
    this.log({
      userId,
      action: `league_${action}`,
      resource: `league:${leagueId}`,
      success
    });
  }

  logLeagueOwnershipAccess(userId: string | undefined, leagueId: string, action: string, success: boolean, details?: Record<string, any>) {
    this.log({
      userId,
      action: `ownership_${action}`,
      resource: `league:${leagueId}`,
      success,
      details: {
        ...details,
        security_level: 'high_sensitivity'
      }
    });
  }

  logUnauthorizedAccess(userId: string | undefined, resource: string, attemptedAction: string) {
    this.log({
      userId,
      action: `unauthorized_${attemptedAction}`,
      resource,
      success: false,
      details: {
        security_level: 'security_violation',
        timestamp: new Date().toISOString()
      }
    });
  }

  logAuthAction(userId: string | undefined, action: string, success: boolean, details?: Record<string, any>) {
    this.log({
      userId,
      action: `auth_${action}`,
      resource: 'authentication',
      success,
      details
    });
  }

  logDataModification(userId: string | undefined, table: string, operation: string, success: boolean, details?: Record<string, any>) {
    this.log({
      userId,
      action: `data_${operation}`,
      resource: table,
      success,
      details
    });
  }

  getRecentLogs(limit: number = 100): SecurityLogEntry[] {
    return this.logs.slice(0, limit);
  }

  getLogsByUser(userId: string, limit: number = 100): SecurityLogEntry[] {
    return this.logs
      .filter(log => log.userId === userId)
      .slice(0, limit);
  }

  // Method to export logs for external analysis
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const securityLogger = new SecurityLogger();

// Enhanced logging methods for league management
export const logLeagueSwitch = (userId: string | undefined, fromLeagueId: string | null, toLeagueId: string, success: boolean, metadata?: Record<string, any>) => {
  securityLogger.log({
    userId,
    action: 'league_switch',
    resource: `league:${toLeagueId}`,
    success,
    details: {
      fromLeagueId,
      toLeagueId,
      switchTime: new Date().toISOString(),
      ...metadata
    }
  });
};

export const logLeagueDataSync = (userId: string | undefined, leagueId: string, operation: string, success: boolean, syncDetails?: Record<string, any>) => {
  securityLogger.log({
    userId,
    action: `league_sync_${operation}`,
    resource: `league:${leagueId}`,
    success,
    details: {
      operation,
      timestamp: new Date().toISOString(),
      ...syncDetails
    }
  });
};

export const logRLSViolation = (userId: string | undefined, table: string, operation: string, leagueId: string, details?: Record<string, any>) => {
  securityLogger.log({
    userId,
    action: `rls_violation_${operation}`,
    resource: `${table}:${leagueId}`,
    success: false,
    details: {
      table,
      operation,
      leagueId,
      violation_type: 'rls_policy_denied',
      security_level: 'critical',
      timestamp: new Date().toISOString(),
      ...details
    }
  });
};

export const logLeagueIntegrityCheck = (leagueId: string, checkType: string, passed: boolean, details?: Record<string, any>) => {
  securityLogger.log({
    userId: undefined,
    action: `integrity_check_${checkType}`,
    resource: `league:${leagueId}`,
    success: passed,
    details: {
      checkType,
      passed,
      timestamp: new Date().toISOString(),
      ...details
    }
  });
};


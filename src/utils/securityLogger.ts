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

// Helper functions for common logging scenarios
export const logLeagueOwnershipClaim = (userId: string | undefined, leagueId: string, success: boolean) => {
  securityLogger.logLeagueAccess(userId, leagueId, 'claim', success);
};

export const logLeagueOwnershipAccess = (userId: string | undefined, leagueId: string, action: string, success: boolean, details?: Record<string, any>) => {
  securityLogger.logLeagueOwnershipAccess(userId, leagueId, action, success, details);
};

export const logUnauthorizedAccess = (userId: string | undefined, resource: string, attemptedAction: string) => {
  securityLogger.logUnauthorizedAccess(userId, resource, attemptedAction);
};

export const logDataAccess = (userId: string | undefined, table: string, operation: 'read' | 'write' | 'delete', success: boolean) => {
  securityLogger.logDataModification(userId, table, operation, success);
};

export const logAuthenticationAttempt = (userId: string | undefined, method: string, success: boolean) => {
  securityLogger.logAuthAction(userId, method, success);
};

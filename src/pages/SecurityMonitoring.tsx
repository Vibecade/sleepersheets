import React from 'react';
import { SecurityMonitoringDashboard } from '@/components/monitoring/SecurityMonitoringDashboard';
import PageHead from '@/components/PageHead';

const SecurityMonitoring: React.FC = () => {
  return (
    <>
      <PageHead 
        title="Security Monitoring - FantasyLab" 
        description="Real-time security monitoring and data integrity dashboard for league management"
        canonicalUrl="/security-monitoring"
      />
      <SecurityMonitoringDashboard />
    </>
  );
};

export default SecurityMonitoring;
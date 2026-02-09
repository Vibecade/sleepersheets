import React from 'react';
import { Badge } from '@/components/ui/badge';
import ProgressIndicator from '@/components/ui/progress-indicator';

interface TeamSalaryDisplayProps {
  teamSalary: number;
  teamDeadCap: number;
  deadCapEnabled: boolean;
  salaryCap: number;
  teamFAABSpent?: number;
}

const TeamSalaryDisplay: React.FC<TeamSalaryDisplayProps> = ({
  teamSalary,
  teamDeadCap,
  deadCapEnabled,
  salaryCap,
  teamFAABSpent = 0
}) => {
  const formatSalary = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  const getSalaryCapStatus = (teamSalary: number) => {
    const percentage = (teamSalary / salaryCap) * 100;
    if (percentage > 100) return { color: 'text-destructive', bg: 'bg-destructive/10', status: 'Over Cap' };
    if (percentage > 90) return { color: 'text-yellow-400', bg: 'bg-yellow-500/10', status: 'Near Cap' };
    return { color: 'text-success', bg: 'bg-success/10', status: 'Under Cap' };
  };

  const salaryStatus = getSalaryCapStatus(teamSalary);
  const percentage = (teamSalary / salaryCap) * 100;
  
  const getProgressVariant = () => {
    if (percentage > 100) return 'danger';
    if (percentage > 90) return 'warning';
    return 'success';
  };

  return (
    <div className="bg-accent/20 rounded-lg p-4 border border-border-light space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm font-medium">Salary Cap Usage</span>
        <Badge variant="outline" className={`${salaryStatus.bg} ${salaryStatus.color} border-current text-xs`}>
          {salaryStatus.status}
        </Badge>
      </div>

      <ProgressIndicator
        value={teamSalary}
        max={salaryCap}
        variant={getProgressVariant()}
        showPercentage={true}
        showValues={true}
        size="md"
      />

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Active:</span>
          <span className="font-medium text-success">
            {formatSalary(teamSalary)}
          </span>
        </div>
        {deadCapEnabled && teamDeadCap > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Dead Cap:</span>
            <span className="font-medium text-destructive">
              {formatSalary(teamDeadCap)}
            </span>
          </div>
        )}
        {teamFAABSpent > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">FAAB Spent:</span>
            <span className="font-medium text-blue-400">
              {formatSalary(teamFAABSpent)}
            </span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-border-light">
        <span className="text-foreground font-medium">Cap Space:</span>
        <span className={`font-bold ${salaryCap - teamSalary > 0 ? 'text-success' : 'text-destructive'}`}>
          {formatSalary(salaryCap - teamSalary)}
        </span>
      </div>
      
      {teamFAABSpent > 0 && (
        <div className="text-xs text-muted-foreground pt-1">
          FAAB costs don't count toward salary cap
        </div>
      )}
    </div>
  );
};

export default TeamSalaryDisplay;
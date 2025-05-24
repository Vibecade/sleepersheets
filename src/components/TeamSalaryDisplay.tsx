
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface TeamSalaryDisplayProps {
  teamSalary: number;
  teamDeadCap: number;
  deadCapEnabled: boolean;
  salaryCap: number;
}

const TeamSalaryDisplay: React.FC<TeamSalaryDisplayProps> = ({
  teamSalary,
  teamDeadCap,
  deadCapEnabled,
  salaryCap
}) => {
  const formatSalary = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  const getSalaryCapStatus = (teamSalary: number, deadCap: number = 0) => {
    const totalSalary = teamSalary + deadCap;
    const percentage = (totalSalary / salaryCap) * 100;
    if (percentage > 100) return { color: 'text-red-400', bg: 'bg-red-500/10', status: 'Over Cap' };
    if (percentage > 90) return { color: 'text-amber-400', bg: 'bg-amber-500/10', status: 'Near Cap' };
    return { color: 'text-green-400', bg: 'bg-green-500/10', status: 'Under Cap' };
  };

  const salaryStatus = getSalaryCapStatus(teamSalary, teamDeadCap);

  return (
    <>
      <Separator className="bg-white/10" />
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-gray-300 text-xs sm:text-sm">Active Salary:</span>
          <span className={`font-medium text-xs sm:text-sm text-emerald-400`}>
            {formatSalary(teamSalary)}
          </span>
        </div>
        {deadCapEnabled && teamDeadCap > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-gray-300 text-xs sm:text-sm">Dead Cap:</span>
            <span className="font-medium text-xs sm:text-sm text-red-400">
              {formatSalary(teamDeadCap)}
            </span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-gray-300 text-xs sm:text-sm">Total:</span>
          <span className={`font-medium text-xs sm:text-sm ${salaryStatus.color}`}>
            {formatSalary(teamSalary + teamDeadCap)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-300 text-xs">Status:</span>
          <Badge variant="outline" className={`${salaryStatus.bg} ${salaryStatus.color} border-current text-xs`}>
            {salaryStatus.status}
          </Badge>
        </div>
      </div>
    </>
  );
};

export default TeamSalaryDisplay;

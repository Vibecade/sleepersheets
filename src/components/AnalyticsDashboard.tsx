
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import PositionDistributionChart from './charts/PositionDistributionChart';
import SalaryCapChart from './charts/SalaryCapChart';
import TeamRosterSizeChart from './charts/TeamRosterSizeChart';

interface AnalyticsDashboardProps {
  rosters: any[];
  userMap: Record<string, any>;
  players: Record<string, any>;
  teamSalaries?: Record<number, number>;
  salaryCap?: number;
  showSalaryFeatures?: boolean;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  rosters,
  userMap,
  players,
  teamSalaries = {},
  salaryCap = 200000,
  showSalaryFeatures = false
}) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-6 h-6 text-blue-500" />
            <div>
              <CardTitle className="text-2xl">League Analytics</CardTitle>
              <CardDescription>
                Visual insights and statistics for your fantasy league
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <TeamRosterSizeChart 
          rosters={rosters}
          userMap={userMap}
        />
        
        <PositionDistributionChart 
          rosters={rosters}
          players={players}
        />
      </div>

      {showSalaryFeatures && Object.keys(teamSalaries).length > 0 && (
        <SalaryCapChart 
          rosters={rosters}
          userMap={userMap}
          teamSalaries={teamSalaries}
          salaryCap={salaryCap}
        />
      )}
    </div>
  );
};

export default AnalyticsDashboard;

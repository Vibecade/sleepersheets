
import React from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';
import TeamRosters from './TeamRosters';

interface FantasyManagerProps {
  rosters: any[];
  userMap: Record<string, any>;
  players: Record<string, any>;
}

const FantasyManager: React.FC<FantasyManagerProps> = ({
  rosters,
  userMap,
  players
}) => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <Settings className="w-6 h-6 text-blue-500" />
            <div>
              <CardTitle className="text-2xl">Fantasy Manager</CardTitle>
              <p className="text-gray-400">
                Advanced tools for salary cap, FAAB, dead cap management, and detailed roster analysis
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Team Rosters with all advanced features */}
      <TeamRosters
        rosters={rosters}
        userMap={userMap}
        players={players}
      />
    </div>
  );
};

export default FantasyManager;

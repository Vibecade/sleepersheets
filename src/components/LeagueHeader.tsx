
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

interface LeagueHeaderProps {
  league: any;
  transactionCount: number;
  draftPickCount: number;
  draftCount: number;
}

const LeagueHeader: React.FC<LeagueHeaderProps> = ({ 
  league, 
  transactionCount, 
  draftPickCount, 
  draftCount 
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-green-600 rounded-lg p-2">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">{league.name}</CardTitle>
              <CardDescription>
                {league.total_rosters} teams • Season {league.season} • Week {league.settings?.week || 'N/A'}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{league.total_rosters}</div>
            <div className="text-sm text-gray-600">Teams</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{transactionCount}</div>
            <div className="text-sm text-gray-600">Transactions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{draftPickCount}</div>
            <div className="text-sm text-gray-600">Draft Picks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{draftCount}</div>
            <div className="text-sm text-gray-600">Drafts</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeagueHeader;

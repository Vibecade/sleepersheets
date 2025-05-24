
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Users, Activity, Calendar, Target } from 'lucide-react';

interface LeagueHeaderProps {
  league: any;
  transactionCount: number;
  draftPickCount: number;
  draftCount: number;
  onRefreshData?: () => Promise<void>;
}

const LeagueHeader: React.FC<LeagueHeaderProps> = ({ 
  league, 
  transactionCount, 
  draftPickCount, 
  draftCount,
  onRefreshData
}) => {
  return (
    <Card className="glass-card fade-in">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl p-3 shadow-lg">
              <Trophy className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl md:text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {league.name}
              </CardTitle>
              <CardDescription className="text-gray-400 text-sm md:text-lg">
                {league.total_rosters} teams • Season {league.season} • Week {league.settings?.week || 'N/A'}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          <div className="glass p-3 md:p-4 rounded-xl text-center group hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-center mb-2">
              <Users className="w-5 h-5 md:w-6 md:h-6 text-emerald-400" />
            </div>
            <div className="text-xl md:text-3xl font-bold text-white mb-1">{league.total_rosters}</div>
            <div className="text-xs md:text-sm text-gray-400">Teams</div>
          </div>
          <div className="glass p-3 md:p-4 rounded-xl text-center group hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-center mb-2">
              <Activity className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
            </div>
            <div className="text-xl md:text-3xl font-bold text-white mb-1">{transactionCount}</div>
            <div className="text-xs md:text-sm text-gray-400">Transactions</div>
          </div>
          <div className="glass p-3 md:p-4 rounded-xl text-center group hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-center mb-2">
              <Target className="w-5 h-5 md:w-6 md:h-6 text-purple-400" />
            </div>
            <div className="text-xl md:text-3xl font-bold text-white mb-1">{draftPickCount}</div>
            <div className="text-xs md:text-sm text-gray-400">Draft Picks</div>
          </div>
          <div className="glass p-3 md:p-4 rounded-xl text-center group hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-center mb-2">
              <Calendar className="w-5 h-5 md:w-6 md:h-6 text-orange-400" />
            </div>
            <div className="text-xl md:text-3xl font-bold text-white mb-1">{draftCount}</div>
            <div className="text-xs md:text-sm text-gray-400">Drafts</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeagueHeader;

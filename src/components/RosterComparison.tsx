import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { TrendingUp, TrendingDown, Users, Trophy } from 'lucide-react';

interface Team {
  name: string;
  avatar?: string;
  roster: any;
  starters: string[];
  bench: string[];
  points: number;
}

interface RosterComparisonProps {
  team1: Team;
  team2: Team;
  players: Record<string, any>;
}

export const RosterComparison: React.FC<RosterComparisonProps> = ({
  team1,
  team2,
  players
}) => {
  const getPositionBreakdown = (playerIds: string[]) => {
    const positions: Record<string, number> = {};
    playerIds.forEach(playerId => {
      const player = players[playerId];
      if (player?.position) {
        positions[player.position] = (positions[player.position] || 0) + 1;
      }
    });
    return positions;
  };

  const getTeamStats = (team: Team) => {
    const allPlayers = [...team.starters, ...team.bench];
    const positions = getPositionBreakdown(allPlayers);
    
    return {
      totalPlayers: allPlayers.length,
      startersCount: team.starters.length,
      benchCount: team.bench.length,
      positions,
      averageAge: 0, // Could be calculated if age data available
      points: team.points
    };
  };

  const team1Stats = getTeamStats(team1);
  const team2Stats = getTeamStats(team2);

  const StatComparison = ({ 
    label, 
    team1Value, 
    team2Value, 
    format = (v: number) => v.toString(),
    showProgress = true 
  }: {
    label: string;
    team1Value: number;
    team2Value: number;
    format?: (value: number) => string;
    showProgress?: boolean;
  }) => {
    const total = team1Value + team2Value;
    const team1Percentage = total > 0 ? (team1Value / total) * 100 : 50;
    const team2Percentage = total > 0 ? (team2Value / total) * 100 : 50;
    
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h4 className="font-medium text-sm">{label}</h4>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-primary font-semibold">{format(team1Value)}</span>
          <span className="text-primary font-semibold">{format(team2Value)}</span>
        </div>
        {showProgress && total > 0 && (
          <div className="relative">
            <Progress value={team1Percentage} className="h-2" />
            <div 
              className="absolute top-0 right-0 h-2 bg-secondary rounded-r-full"
              style={{ width: `${team2Percentage}%` }}
            />
          </div>
        )}
      </div>
    );
  };

  const PositionBreakdown = ({ positions, teamName }: { positions: Record<string, number>; teamName: string }) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Position Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {Object.entries(positions).sort(([,a], [,b]) => b - a).map(([position, count]) => (
          <div key={position} className="flex justify-between items-center">
            <Badge variant="outline" className="text-xs">
              {position}
            </Badge>
            <span className="text-sm font-medium">{count}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  const winner = team1.points > team2.points ? team1 : team2;
  const loser = team1.points > team2.points ? team2 : team1;

  return (
    <div className="space-y-6">
      {/* Overall Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="w-5 h-5" />
            <span>Matchup Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-accent/20 rounded-lg">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage 
                  src={winner.avatar ? `https://sleepercdn.com/avatars/thumbs/${winner.avatar}` : undefined}
                  alt={`${winner.name} avatar`}
                />
                <AvatarFallback className="bg-primary/20 text-primary-foreground">
                  {winner.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-primary">{winner.name}</p>
                <p className="text-sm text-muted-foreground">Winner</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-lg font-bold text-primary">
                  {winner.points.toFixed(1)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                +{(winner.points - loser.points).toFixed(1)} pts
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Headers */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <Avatar className="mx-auto mb-2">
            <AvatarImage 
              src={team1.avatar ? `https://sleepercdn.com/avatars/thumbs/${team1.avatar}` : undefined}
              alt={`${team1.name} avatar`}
            />
            <AvatarFallback className="bg-primary/20 text-primary-foreground">
              {team1.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h3 className="font-semibold truncate">{team1.name}</h3>
        </div>
        <div className="text-center">
          <Avatar className="mx-auto mb-2">
            <AvatarImage 
              src={team2.avatar ? `https://sleepercdn.com/avatars/thumbs/${team2.avatar}` : undefined}
              alt={`${team2.name} avatar`}
            />
            <AvatarFallback className="bg-primary/20 text-primary-foreground">
              {team2.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h3 className="font-semibold truncate">{team2.name}</h3>
        </div>
      </div>

      {/* Statistical Comparisons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Roster Statistics</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <StatComparison
            label="Total Fantasy Points"
            team1Value={team1Stats.points}
            team2Value={team2Stats.points}
            format={(v) => v.toFixed(1)}
          />
          <StatComparison
            label="Starting Players"
            team1Value={team1Stats.startersCount}
            team2Value={team2Stats.startersCount}
          />
          <StatComparison
            label="Bench Depth"
            team1Value={team1Stats.benchCount}
            team2Value={team2Stats.benchCount}
          />
          <StatComparison
            label="Total Roster Size"
            team1Value={team1Stats.totalPlayers}
            team2Value={team2Stats.totalPlayers}
          />
        </CardContent>
      </Card>

      {/* Position Breakdowns */}
      <div className="grid md:grid-cols-2 gap-4">
        <PositionBreakdown positions={team1Stats.positions} teamName={team1.name} />
        <PositionBreakdown positions={team2Stats.positions} teamName={team2.name} />
      </div>
    </div>
  );
};
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Calendar, DollarSign, Users, TrendingUp } from 'lucide-react';
import { TeamFreeAgentSummary, PendingFreeAgent } from '@/hooks/usePendingFreeAgents';
import { getTeamName } from '@/utils/leagueDataUtils';

interface PendingFreeAgentsDisplayProps {
  teamSummaries: Record<number, TeamFreeAgentSummary>;
  userMap: Record<string, any>;
  rosters: any[];
  players: Record<string, any>;
  leagueTotals: { totalPlayers: number; totalExpiringValue: number };
  salaryCap: number;
  teamSalaries: Record<number, number>;
}

const formatSalary = (amount: number) => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount.toLocaleString()}`;
};

const getReasonBadge = (reason: PendingFreeAgent['reason']) => {
  switch (reason) {
    case 'expiring':
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs">
          Contract Expiring
        </Badge>
      );
    case 'no_contract':
      return (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs">
          No Contract
        </Badge>
      );
    case 'faab':
      return (
        <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 text-xs">
          FAAB Pickup
        </Badge>
      );
    default:
      return null;
  }
};

const PlayerRow: React.FC<{ player: PendingFreeAgent; playerData: any }> = ({ player, playerData }) => {
  const playerName = playerData?.full_name || playerData?.first_name && playerData?.last_name
    ? `${playerData.first_name} ${playerData.last_name}`
    : `Player ${player.playerId}`;
  const position = playerData?.position || 'N/A';
  const team = playerData?.team || 'FA';

  return (
    <div className="flex items-center justify-between py-2 px-3 bg-accent/20 rounded-lg">
      <div className="flex items-center space-x-3 min-w-0 flex-1">
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage
            src={`https://sleepercdn.com/content/nfl/players/thumb/${player.playerId}.jpg`}
            alt={playerName}
            loading="lazy"
          />
          <AvatarFallback className="text-xs bg-muted">
            {position}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">{playerName}</p>
          <p className="text-xs text-muted-foreground">{position} - {team}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2 flex-shrink-0">
        {player.salary > 0 && (
          <span className="text-sm font-medium text-success">{formatSalary(player.salary)}</span>
        )}
        {getReasonBadge(player.reason)}
      </div>
    </div>
  );
};

const TeamFreeAgentsCard: React.FC<{
  summary: TeamFreeAgentSummary;
  user: any;
  players: Record<string, any>;
  teamSalary: number;
  salaryCap: number;
}> = ({ summary, user, players, teamSalary, salaryCap }) => {
  const teamName = getTeamName(user);
  const expiringPlayers = summary.players.filter(p => p.reason === 'expiring');
  const noContractPlayers = summary.players.filter(p => p.reason !== 'expiring');

  if (summary.players.length === 0) {
    return null;
  }

  const projectedCapSpace = salaryCap - teamSalary + summary.potentialCapSpace;

  return (
    <Card className="border border-border-light bg-card/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10 ring-2 ring-primary/20">
              <AvatarImage
                src={user?.avatar ? `https://sleepercdn.com/avatars/thumbs/${user.avatar}` : undefined}
                alt={teamName}
              />
              <AvatarFallback className="bg-primary/20 text-primary font-bold text-sm">
                {teamName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">{teamName}</CardTitle>
              <CardDescription className="text-xs">
                {summary.players.length} potential free agent{summary.players.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-1 text-success">
              <TrendingUp className="w-4 h-4" />
              <span className="font-bold">{formatSalary(summary.potentialCapSpace)}</span>
            </div>
            <p className="text-xs text-muted-foreground">Potential Cap Freed</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {expiringPlayers.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-amber-400">Expiring Contracts ({expiringPlayers.length})</span>
            </div>
            <div className="space-y-1">
              {expiringPlayers.map((player) => (
                <PlayerRow key={player.playerId} player={player} playerData={players[player.playerId]} />
              ))}
            </div>
          </div>
        )}

        {noContractPlayers.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">No Contract / FAAB ({noContractPlayers.length})</span>
            </div>
            <div className="space-y-1">
              {noContractPlayers.map((player) => (
                <PlayerRow key={player.playerId} player={player} playerData={players[player.playerId]} />
              ))}
            </div>
          </div>
        )}

        <Separator className="bg-border-light" />

        <div className="bg-success/10 rounded-lg p-3 border border-success/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-success" />
              <span className="text-sm font-medium text-foreground">Projected Draft Cap</span>
            </div>
            <span className="font-bold text-success text-lg">{formatSalary(projectedCapSpace)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Current cap space + expiring/uncontracted salary
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

const PendingFreeAgentsDisplay: React.FC<PendingFreeAgentsDisplayProps> = ({
  teamSummaries,
  userMap,
  rosters,
  players,
  leagueTotals,
  salaryCap,
  teamSalaries
}) => {
  const sortedTeams = useMemo(() => {
    return Object.values(teamSummaries)
      .filter(summary => summary.players.length > 0)
      .sort((a, b) => b.potentialCapSpace - a.potentialCapSpace);
  }, [teamSummaries]);

  const rosterMap = useMemo(() => {
    const map: Record<number, any> = {};
    rosters.forEach(roster => {
      map[roster.roster_id] = roster;
    });
    return map;
  }, [rosters]);

  if (sortedTeams.length === 0) {
    return (
      <Card className="border border-border-light">
        <CardContent className="py-8 text-center">
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No pending free agents detected</p>
          <p className="text-sm text-muted-foreground mt-1">
            Players with 1 year left on contracts or no contract will appear here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-amber-500/10 rounded-lg p-3 border border-amber-500/20">
          <div className="flex items-center space-x-2 mb-1">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-muted-foreground">Expiring</span>
          </div>
          <p className="text-xl font-bold text-amber-400">
            {Object.values(teamSummaries).reduce((sum, t) => sum + t.players.filter(p => p.reason === 'expiring').length, 0)}
          </p>
        </div>
        <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
          <div className="flex items-center space-x-2 mb-1">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-muted-foreground">No Contract</span>
          </div>
          <p className="text-xl font-bold text-blue-400">
            {Object.values(teamSummaries).reduce((sum, t) => sum + t.players.filter(p => p.reason !== 'expiring').length, 0)}
          </p>
        </div>
        <div className="bg-success/10 rounded-lg p-3 border border-success/20">
          <div className="flex items-center space-x-2 mb-1">
            <DollarSign className="w-4 h-4 text-success" />
            <span className="text-xs text-muted-foreground">Total Value</span>
          </div>
          <p className="text-xl font-bold text-success">
            {formatSalary(Object.values(teamSummaries).reduce((sum, t) => sum + t.potentialCapSpace, 0))}
          </p>
        </div>
        <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
          <div className="flex items-center space-x-2 mb-1">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Teams Affected</span>
          </div>
          <p className="text-xl font-bold text-primary">{sortedTeams.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedTeams.map((summary) => {
          const roster = rosterMap[summary.rosterId];
          const user = roster ? userMap[roster.owner_id] : null;

          return (
            <TeamFreeAgentsCard
              key={summary.rosterId}
              summary={summary}
              user={user}
              players={players}
              teamSalary={teamSalaries[summary.rosterId] || 0}
              salaryCap={salaryCap}
            />
          );
        })}
      </div>
    </div>
  );
};

export default PendingFreeAgentsDisplay;

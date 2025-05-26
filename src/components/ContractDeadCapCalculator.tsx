
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calculator, AlertTriangle } from 'lucide-react';
import { useFAABCalculations } from '@/hooks/useFAABCalculations';
import { usePlayerContracts } from '@/hooks/usePlayerContracts';
import { usePlayerSalaries } from '@/hooks/usePlayerSalaries';

interface ContractDeadCapCalculatorProps {
  leagueId: string;
  players: Record<string, any>;
}

const ContractDeadCapCalculator: React.FC<ContractDeadCapCalculatorProps> = ({
  leagueId,
  players
}) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [playerSearch, setPlayerSearch] = useState('');
  
  const { calculateTotalDeadCapForPlayer } = useFAABCalculations({ rosters: [], leagueId });
  const { contracts } = usePlayerContracts(leagueId);
  const { salaries } = usePlayerSalaries(leagueId);

  // Filter players with contracts
  const playersWithContracts = Object.entries(players).filter(([playerId, player]) => {
    const hasContract = contracts[playerId] && contracts[playerId] > 0;
    const hasSalary = salaries[playerId] && salaries[playerId] > 0;
    const matchesSearch = !playerSearch || 
      `${player.first_name} ${player.last_name}`.toLowerCase().includes(playerSearch.toLowerCase());
    
    return hasContract && hasSalary && matchesSearch;
  }).slice(0, 20);

  const calculatePlayerDeadCap = (playerId: string) => {
    return calculateTotalDeadCapForPlayer(playerId);
  };

  const formatSalary = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-lg p-2">
            <Calculator className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg">Contract Dead Cap Calculator</CardTitle>
            <CardDescription>
              Calculate potential dead cap penalties for players with contracts (25% rule)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-gray-300">Search Players with Contracts</label>
          <Input
            placeholder="Search by player name..."
            value={playerSearch}
            onChange={(e) => setPlayerSearch(e.target.value)}
            className="bg-white/10 border-white/20 text-white"
          />
        </div>

        {playersWithContracts.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-white">Players with Active Contracts</h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {playersWithContracts.map(([playerId, player]) => {
                const contractLength = contracts[playerId];
                const salary = salaries[playerId];
                const deadCap = calculatePlayerDeadCap(playerId);
                
                return (
                  <div 
                    key={playerId}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-white">
                        {player.first_name} {player.last_name}
                      </div>
                      <div className="text-sm text-gray-400">
                        {player.position} • {player.team || 'FA'} • 
                        Contract: {contractLength} yr{contractLength !== 1 ? 's' : ''} • 
                        Salary: {formatSalary(salary)}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-1">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-orange-400" />
                        <span className="text-sm text-gray-300">Dead Cap Impact:</span>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-orange-400 border-orange-400 text-xs">
                          This Year: {formatSalary(deadCap.currentYear)}
                        </Badge>
                        {deadCap.nextYear > 0 && (
                          <Badge variant="outline" className="text-red-400 border-red-400 text-xs ml-1">
                            Next Year: {formatSalary(deadCap.nextYear)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {playersWithContracts.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No players found with active contracts and salaries</p>
            <p className="text-sm">Upload contract information and salaries to use this calculator</p>
          </div>
        )}

        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Dead Cap Rules:</strong>
              <ul className="mt-1 space-y-1">
                <li>• 25% of player salary becomes dead cap when dropped</li>
                <li>• Last year of contract: penalty applies current year only</li>
                <li>• Multi-year contracts: penalty applies current + next year</li>
                <li>• Based on remaining contract length at time of drop</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContractDeadCapCalculator;

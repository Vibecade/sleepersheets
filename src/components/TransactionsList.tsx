
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRightLeft, Plus, Minus, RefreshCw, Calendar, Users, Search, Filter, X } from 'lucide-react';
import { getTeamName } from '@/utils/leagueDataUtils';
import PlayerSearch from './PlayerSearch';

interface TransactionsListProps {
  transactions: any[];
  userMap: Record<string, any>;
  players: Record<string, any>;
  league: any;
}

const TransactionsList: React.FC<TransactionsListProps> = ({
  transactions,
  userMap,
  players,
  league
}) => {
  const [selectedWeek, setSelectedWeek] = useState(league?.settings?.leg || 1);
  const [transactionType, setTransactionType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const getPlayerName = (playerId: string): string => {
    const player = players[playerId];
    return player?.full_name || player?.first_name + ' ' + player?.last_name || 'Unknown Player';
  };

  const getPlayerPosition = (playerId: string): string => {
    const player = players[playerId];
    return player?.position || 'N/A';
  };

  const getPlayerTeam = (playerId: string): string => {
    const player = players[playerId];
    return player?.team || 'FA';
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'trade': return 'bg-blue-500/20 text-blue-400 border-blue-400';
      case 'waiver': return 'bg-green-500/20 text-green-400 border-green-400';
      case 'free_agent': return 'bg-purple-500/20 text-purple-400 border-purple-400';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-400';
    }
  };

  const formatTransactionType = (type: string) => {
    switch (type) {
      case 'free_agent': return 'Free Agent';
      case 'waiver': return 'Waiver';
      case 'trade': return 'Trade';
      default: return type?.charAt(0).toUpperCase() + type?.slice(1) || 'Unknown';
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      // Use 'leg' field from API (which represents week) or fall back to 'week'
      const transactionWeek = transaction.leg || transaction.week;
      const weekMatch = !selectedWeek || transactionWeek === selectedWeek;
      const typeMatch = transactionType === 'all' || transaction.type === transactionType;
      
      // Search filter
      const searchMatch = !searchTerm || (
        // Search in player names
        (transaction.adds && Object.keys(transaction.adds).some(playerId => 
          getPlayerName(playerId).toLowerCase().includes(searchTerm.toLowerCase())
        )) ||
        (transaction.drops && Object.keys(transaction.drops).some(playerId => 
          getPlayerName(playerId).toLowerCase().includes(searchTerm.toLowerCase())
        )) ||
        // Search in team names
        getTeamName(userMap[transaction.creator]).toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      return weekMatch && typeMatch && searchMatch;
    });
  }, [transactions, selectedWeek, transactionType, searchTerm, userMap, players]);

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    return new Date(b.created || 0).getTime() - new Date(a.created || 0).getTime();
  });

  return (
    <Card className="glass-card border-border-light transition-all duration-300 hover:shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ArrowRightLeft className="w-5 h-5 text-primary" />
              <CardTitle className="text-xl font-bold">League Transactions</CardTitle>
              <Badge variant="outline" className="text-xs">
                {sortedTransactions.length} total
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSearch(!showSearch)}
              className="transition-all duration-200"
            >
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>

          {/* Search Bar */}
          {showSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search players or teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-card/50 border-border-light"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="week-filter" className="text-sm font-medium">Week:</Label>
              <Input
                id="week-filter"
                type="number"
                min="1"
                max="18"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(Number(e.target.value))}
                className="w-20 bg-card/50 border-border-light"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="type-filter" className="text-sm font-medium">Type:</Label>
              <select
                id="type-filter"
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value)}
                className="px-3 py-1.5 bg-card/50 border border-border-light rounded-md text-sm transition-colors hover:bg-card"
              >
                <option value="all">All Types</option>
                <option value="trade">Trades</option>
                <option value="waiver">Waivers</option>
                <option value="free_agent">Free Agents</option>
              </select>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sortedTransactions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ArrowRightLeft className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No transactions found</p>
            <p className="text-sm">Try adjusting your filters or search terms</p>
            {(searchTerm || transactionType !== 'all' || selectedWeek) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setTransactionType('all');
                  setSelectedWeek(league?.settings?.leg || 1);
                }}
                className="mt-4"
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {sortedTransactions.map((transaction) => {
              const creator = userMap[transaction.creator];
              const creatorName = getTeamName(creator);
              
              return (
                <div
                  key={transaction.transaction_id}
                  className="bg-card/30 rounded-xl p-4 border border-border-light transition-all duration-300 hover:bg-card/50 hover:border-border hover:shadow-md"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Badge
                        variant="outline"
                        className={`${getTransactionTypeColor(transaction.type)} text-xs font-medium`}
                      >
                        {formatTransactionType(transaction.type)}
                      </Badge>
                      {(transaction.leg || transaction.week) && (
                        <Badge variant="outline" className="text-gray-400 border-gray-400 text-xs">
                          Week {transaction.leg || transaction.week}
                        </Badge>
                      )}
                      <span className="text-sm text-gray-400">
                        by {creatorName}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        transaction.status === 'complete'
                          ? 'text-green-400 border-green-400'
                          : transaction.status === 'failed'
                          ? 'text-red-400 border-red-400'
                          : 'text-yellow-400 border-yellow-400'
                      }`}
                    >
                      {transaction.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Adds */}
                    {transaction.adds && Object.keys(transaction.adds).length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm font-medium text-green-400">
                          <Plus className="w-4 h-4" />
                          <span>Added</span>
                        </div>
                        <div className="space-y-1 pl-6">
                          {Object.entries(transaction.adds).map(([playerId, rosterId]) => {
                            return (
                              <div key={playerId} className="flex items-center justify-between text-sm">
                                <div>
                                  <span className="text-white font-medium">
                                    {getPlayerName(playerId)}
                                  </span>
                                  <span className="text-gray-400 ml-2">
                                    {getPlayerPosition(playerId)} - {getPlayerTeam(playerId)}
                                  </span>
                                </div>
                                <span className="text-green-400 text-xs">
                                  to roster #{String(rosterId)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Drops */}
                    {transaction.drops && Object.keys(transaction.drops).length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm font-medium text-red-400">
                          <Minus className="w-4 h-4" />
                          <span>Dropped</span>
                        </div>
                        <div className="space-y-1 pl-6">
                          {Object.entries(transaction.drops).map(([playerId, rosterId]) => (
                            <div key={playerId} className="flex items-center justify-between text-sm">
                              <div>
                                <span className="text-white font-medium">
                                  {getPlayerName(playerId)}
                                </span>
                                <span className="text-gray-400 ml-2">
                                  {getPlayerPosition(playerId)} - {getPlayerTeam(playerId)}
                                </span>
                              </div>
                              <span className="text-red-400 text-xs">
                                from roster #{String(rosterId)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Draft Picks */}
                  {transaction.draft_picks && transaction.draft_picks.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="flex items-center space-x-2 text-sm font-medium text-blue-400 mb-2">
                        <Calendar className="w-4 h-4" />
                        <span>Draft Picks Involved</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pl-6">
                        {transaction.draft_picks.map((pick: any, index: number) => (
                          <Badge key={index} variant="outline" className="text-blue-400 border-blue-400 text-xs">
                            {String(pick.season)} Round {String(pick.round)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* FAAB Information */}
                  {((transaction.waiver_budget && transaction.waiver_budget.length > 0) || 
                    (transaction.settings && transaction.settings.waiver_bid)) && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <div className="flex items-center space-x-2 text-sm font-medium text-purple-400 mb-2">
                        <span>💰</span>
                        <span>FAAB Details</span>
                      </div>
                      <div className="pl-6 space-y-2">
                        {/* Waiver Bid Amount */}
                        {transaction.settings?.waiver_bid && (
                          <div className="text-sm">
                            <span className="text-purple-400 font-medium">${transaction.settings.waiver_bid}</span>
                            <span className="text-gray-400 ml-2">waiver bid</span>
                          </div>
                        )}
                        
                        {/* FAAB Transfers */}
                        {transaction.waiver_budget && transaction.waiver_budget.length > 0 && 
                          transaction.waiver_budget.map((transfer: any, index: number) => (
                            <div key={index} className="text-sm">
                              <span className="text-purple-400 font-medium">${transfer.amount}</span>
                              <span className="text-gray-400 ml-2">
                                from roster #{transfer.sender} to roster #{transfer.receiver}
                              </span>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionsList;


import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { downloadCSV, formatPlayerName } from '@/utils/csvExport';
import { getTeamName } from '@/utils/leagueDataUtils';
import ExportButton from './ExportButton';

interface TransactionsExportProps {
  league: any;
  transactions: any[];
  rosterUserMap: Record<string, any>;
  players: Record<string, any>;
}

const TransactionsExport: React.FC<TransactionsExportProps> = ({
  league,
  transactions,
  rosterUserMap,
  players
}) => {
  const { toast } = useToast();

  const exportTransactionsToCSV = () => {
    console.log('Preparing clean Transactions CSV export...');
    
    const csvData = [];
    const headers = ['Week', 'Fantasy Team', 'Player Name', 'NFL Team', 'Position', 'Action (Add/Drop/Trade)'];
    
    csvData.push(headers);

    transactions.forEach((transaction) => {
      const week = transaction.leg || transaction.week || 'N/A';

      // Process drops
      if (transaction.drops) {
        Object.entries(transaction.drops as Record<string, string>).forEach(([playerId, rosterId]) => {
          const player = players[playerId];
          const user = rosterUserMap[rosterId];
          const fantasyTeam = getTeamName(user);
          
          if (player) {
            csvData.push([
              week,
              fantasyTeam,
              formatPlayerName(player),
              player.team || 'FA',
              player.position || 'Unknown',
              'Drop'
            ]);
          }
        });
      }

      // Process adds
      if (transaction.adds) {
        Object.entries(transaction.adds as Record<string, string>).forEach(([playerId, rosterId]) => {
          const player = players[playerId];
          const user = rosterUserMap[rosterId];
          const fantasyTeam = getTeamName(user);
          
          if (player) {
            csvData.push([
              week,
              fantasyTeam,
              formatPlayerName(player),
              player.team || 'FA',
              player.position || 'Unknown',
              'Add'
            ]);
          }
        });
      }
    });

    downloadCSV(csvData, `${league.name}_transactions_export.csv`);
    
    toast({
      title: "Clean Transactions Export Complete!",
      description: "Your league transaction data has been downloaded as CSV with clean formatting"
    });
  };

  return (
    <ExportButton
      onClick={exportTransactionsToCSV}
      disabled={transactions.length === 0}
      icon={ArrowUpDown}
      title="Export Transactions"
      description="Simplified add/drop data"
      colorClass="text-blue-600"
      hoverColorClass="hover:bg-blue-700"
    />
  );
};

export default TransactionsExport;

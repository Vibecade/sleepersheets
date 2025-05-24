
import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { downloadCSV, formatPlayerName, addExportOptionsToCSV, ExportOptionsData } from '@/utils/csvExport';
import { getTeamName } from '@/utils/leagueDataUtils';
import { usePlayerSalaries } from '@/hooks/usePlayerSalaries';
import ExportButton from './ExportButton';

interface TransactionsExportProps {
  league: any;
  transactions: any[];
  rosterUserMap: Record<string, any>;
  players: Record<string, any>;
  exportOptions?: ExportOptionsData;
}

const TransactionsExport: React.FC<TransactionsExportProps> = ({
  league,
  transactions,
  rosterUserMap,
  players,
  exportOptions
}) => {
  const { toast } = useToast();
  const { salaries } = usePlayerSalaries(league.league_id);

  const exportTransactionsToCSV = () => {
    console.log('Preparing clean Transactions CSV export...');
    console.log('Current salaries for transactions export:', salaries);
    console.log('Export options:', exportOptions);
    
    const csvData = [];
    const headers = ['Week', 'Fantasy Team', 'Player Name', 'NFL Team', 'Position', 'Action (Add/Drop/Trade)', 'Fantasy Salary'];
    
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
            const salary = salaries[playerId];
            console.log(`Transaction Drop - Player ${formatPlayerName(player)} (${playerId}) salary:`, salary);
            
            csvData.push([
              week,
              fantasyTeam,
              formatPlayerName(player),
              player.team || 'FA',
              player.position || 'Unknown',
              'Drop',
              salary ? `$${salary.toLocaleString()}` : ''
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
            const salary = salaries[playerId];
            console.log(`Transaction Add - Player ${formatPlayerName(player)} (${playerId}) salary:`, salary);
            
            csvData.push([
              week,
              fantasyTeam,
              formatPlayerName(player),
              player.team || 'FA',
              player.position || 'Unknown',
              'Add',
              salary ? `$${salary.toLocaleString()}` : ''
            ]);
          }
        });
      }
    });

    // Add export options if provided
    const finalCsvData = exportOptions 
      ? addExportOptionsToCSV(csvData, exportOptions, league.name)
      : csvData;

    console.log('Final Transactions CSV data with options:', finalCsvData);
    downloadCSV(finalCsvData, `${league.name}_transactions_export.csv`);
    
    toast({
      title: "Clean Transactions Export Complete!",
      description: "Your league transaction data has been downloaded as CSV with clean formatting and fantasy salaries"
    });
  };

  return (
    <ExportButton
      onClick={exportTransactionsToCSV}
      disabled={transactions.length === 0}
      icon={ArrowUpDown}
      title="Export Transactions"
      description="Simplified add/drop data with fantasy salaries"
      colorClass="text-blue-600"
      hoverColorClass="hover:bg-blue-700"
    />
  );
};

export default TransactionsExport;

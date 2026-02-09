import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { downloadCSV, formatPlayerName, addExportOptionsToCSV, ExportOptionsData, getPlayerFranchiseValue, formatDate } from '@/utils/csvExport';
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
    console.log('Preparing enhanced Transactions CSV export...');
    
    const csvData: string[][] = [];
    const headers = [
      'Date',
      'Week',
      'Transaction Type',
      'Fantasy Team',
      'Player Name',
      'NFL Team',
      'Position',
      'Action',
      'FAAB Spent',
      'Fantasy Salary',
      'Franchise Value'
    ];
    
    csvData.push(headers);

    // Sort transactions by date (most recent first)
    const sortedTransactions = [...transactions].sort((a, b) => {
      const dateA = a.status_updated || a.created || 0;
      const dateB = b.status_updated || b.created || 0;
      return dateB - dateA;
    });

    sortedTransactions.forEach((transaction) => {
      const week = transaction.leg || transaction.week || 'N/A';
      const txType = getTransactionType(transaction.type);
      const timestamp = transaction.status_updated || transaction.created;
      const date = timestamp ? formatDate(timestamp) : 'N/A';
      
      // Get FAAB amount if applicable
      const faabAmount = transaction.settings?.waiver_bid || null;

      // Process drops
      if (transaction.drops) {
        Object.entries(transaction.drops as Record<string, string>).forEach(([playerId, rosterId]) => {
          const player = players[playerId];
          const user = rosterUserMap[rosterId];
          const fantasyTeam = getTeamName(user);
          
          if (player) {
            const salary = salaries[playerId];
            const franchiseValue = getPlayerFranchiseValue(player);
            
            csvData.push([
              date,
              String(week),
              txType,
              fantasyTeam,
              formatPlayerName(player),
              player.team || 'FA',
              player.position || 'Unknown',
              'Drop',
              '',
              salary ? `$${salary.toLocaleString()}` : '',
              franchiseValue
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
            const franchiseValue = getPlayerFranchiseValue(player);
            
            csvData.push([
              date,
              String(week),
              txType,
              fantasyTeam,
              formatPlayerName(player),
              player.team || 'FA',
              player.position || 'Unknown',
              'Add',
              faabAmount ? `$${faabAmount}` : '',
              salary ? `$${salary.toLocaleString()}` : '',
              franchiseValue
            ]);
          }
        });
      }

      // Process draft pick trades
      if (transaction.draft_picks && transaction.draft_picks.length > 0) {
        transaction.draft_picks.forEach((pick: any) => {
          const ownerUser = rosterUserMap[pick.owner_id];
          const prevOwnerUser = rosterUserMap[pick.previous_owner_id];
          
          csvData.push([
            date,
            String(week),
            'Trade',
            getTeamName(prevOwnerUser) + ' → ' + getTeamName(ownerUser),
            `${pick.season} Round ${pick.round} Pick`,
            'N/A',
            'Draft Pick',
            'Trade',
            '',
            '',
            ''
          ]);
        });
      }
    });

    // Add export options if provided
    const finalCsvData = exportOptions 
      ? addExportOptionsToCSV(csvData, exportOptions, league.name)
      : csvData;

    downloadCSV(finalCsvData, `${league.name}_transactions_export.csv`);
    
    toast({
      title: "Transactions Export Complete!",
      description: `Exported ${transactions.length} transactions with full details`
    });
  };

  const getTransactionType = (type: string): string => {
    const types: Record<string, string> = {
      'waiver': 'Waiver Claim',
      'free_agent': 'Free Agent',
      'trade': 'Trade',
      'commissioner': 'Commissioner',
      'taxi': 'Taxi Squad'
    };
    return types[type] || type || 'Unknown';
  };

  return (
    <ExportButton
      onClick={exportTransactionsToCSV}
      disabled={transactions.length === 0}
      icon={ArrowUpDown}
      title="Export Transactions"
      description="All transactions with dates, types, FAAB, and trade details"
      colorClass="text-blue-600"
      hoverColorClass="hover:bg-blue-700"
    />
  );
};

export default TransactionsExport;

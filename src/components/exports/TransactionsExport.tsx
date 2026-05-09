import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { downloadCSV, addExportOptionsToCSV, ExportOptionsData } from '@/utils/csvExport';
import { usePlayerSalaries } from '@/hooks/usePlayerSalaries';
import { buildTransactionsCsv } from '@/utils/leagueExportData';
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
  exportOptions,
}) => {
  const { toast } = useToast();
  const { salaries } = usePlayerSalaries(league.league_id);

  const exportTransactionsToCSV = () => {
    const csvData = buildTransactionsCsv({
      transactions,
      players,
      rosterUserMap: rosterUserMap as unknown as Record<number, any>,
      salaries,
    });

    const finalCsvData = exportOptions
      ? addExportOptionsToCSV(csvData, exportOptions, league.name)
      : csvData;

    downloadCSV(finalCsvData, `${league.name}_transactions_export.csv`);

    toast({
      title: 'Transactions exported',
      description: `Exported ${transactions.length} transactions with full details.`,
    });
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

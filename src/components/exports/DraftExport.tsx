import React from 'react';
import { FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { downloadCSV, addExportOptionsToCSV, ExportOptionsData } from '@/utils/csvExport';
import { usePlayerSalaries } from '@/hooks/usePlayerSalaries';
import { usePlayerContracts } from '@/hooks/usePlayerContracts';
import { buildDraftCsv } from '@/utils/leagueExportData';
import ExportButton from './ExportButton';

interface DraftExportProps {
  league: any;
  draftPicks: any[];
  rosterUserMap: Record<string, any>;
  players: Record<string, any>;
  exportOptions?: ExportOptionsData;
}

const DraftExport: React.FC<DraftExportProps> = ({
  league,
  draftPicks,
  rosterUserMap,
  players,
  exportOptions,
}) => {
  const { toast } = useToast();
  const { salaries } = usePlayerSalaries(league.league_id);
  const { contracts } = usePlayerContracts(league.league_id);

  const totalPicks = draftPicks.reduce(
    (acc, entry) => acc + (entry?.picks?.length || 0),
    0,
  );

  const exportDraftToCSV = () => {
    const csvData = buildDraftCsv({
      draftPicks,
      league,
      players,
      rosterUserMap: rosterUserMap as unknown as Record<number, any>,
      salaries,
      contracts,
    });

    const finalCsvData = exportOptions
      ? addExportOptionsToCSV(csvData, exportOptions, league.name)
      : csvData;

    downloadCSV(finalCsvData, `${league.name}_draft_export.csv`);

    toast({
      title: 'Draft exported',
      description: `Exported ${totalPicks} picks with salaries and contract years.`,
    });
  };

  return (
    <ExportButton
      onClick={exportDraftToCSV}
      disabled={totalPicks === 0}
      icon={FileText}
      title="Export Draft"
      description="Draft results with keepers, salaries, and contract years"
      colorClass="text-purple-600"
      hoverColorClass="hover:bg-purple-700"
    />
  );
};

export default DraftExport;

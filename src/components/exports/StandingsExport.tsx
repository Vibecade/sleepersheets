import React from 'react';
import { Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { downloadCSV, addExportOptionsToCSV, ExportOptionsData } from '@/utils/csvExport';
import { buildStandingsCsv } from '@/utils/leagueExportData';
import ExportButton from './ExportButton';

interface StandingsExportProps {
  league: any;
  rosters: any[];
  userMap: Record<string, any>;
  exportOptions?: ExportOptionsData;
}

const StandingsExport: React.FC<StandingsExportProps> = ({
  league,
  rosters,
  userMap,
  exportOptions,
}) => {
  const { toast } = useToast();

  const exportStandingsToCSV = () => {
    const csvData = buildStandingsCsv({ rosters, userMap });

    const finalCsvData = exportOptions
      ? addExportOptionsToCSV(csvData, exportOptions, league.name)
      : csvData;

    downloadCSV(finalCsvData, `${league.name}_standings_export.csv`);

    toast({
      title: 'Standings exported',
      description: 'W/L records, win %, and point totals downloaded.',
    });
  };

  return (
    <ExportButton
      onClick={exportStandingsToCSV}
      disabled={rosters.length === 0}
      icon={Trophy}
      title="Export Standings"
      description="Team rankings with W/L records, win %, and point totals"
      colorClass="text-yellow-600"
      hoverColorClass="hover:bg-yellow-700"
    />
  );
};

export default StandingsExport;

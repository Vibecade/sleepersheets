import React, { useState } from 'react';
import { Swords } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { downloadCSV, addExportOptionsToCSV, ExportOptionsData } from '@/utils/csvExport';
import { cachedFetch } from '@/utils/apiCache';
import { buildMatchupsCsv } from '@/utils/leagueExportData';
import ExportButton from './ExportButton';

interface MatchupsExportProps {
  league: any;
  rosters: any[];
  userMap: Record<string, any>;
  exportOptions?: ExportOptionsData;
}

interface Matchup {
  roster_id: number;
  matchup_id: number;
  points: number;
}

const MatchupsExport: React.FC<MatchupsExportProps> = ({
  league,
  rosters,
  userMap,
  exportOptions,
}) => {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);

  const exportMatchupsToCSV = async () => {
    setExporting(true);
    try {
      const currentWeek = Number(league.settings?.leg || 1);
      const maxWeeks = Math.min(currentWeek, 18);

      const matchupsByWeek = new Map<number, Matchup[]>();
      const results = await Promise.allSettled(
        Array.from({ length: maxWeeks }, (_, i) => i + 1).map(async (week) => {
          const weekData = await cachedFetch<Matchup[]>(
            `https://api.sleeper.app/v1/league/${league.league_id}/matchups/${week}`,
            {},
            5 * 60 * 1000,
          );
          return { week, weekData };
        }),
      );
      results.forEach((r) => {
        if (r.status === 'fulfilled' && Array.isArray(r.value.weekData)) {
          matchupsByWeek.set(r.value.week, r.value.weekData);
        }
      });

      const csvData = buildMatchupsCsv({ matchupsByWeek, rosters, userMap });

      if (csvData.length <= 1) {
        toast({
          title: 'No matchup data',
          description: 'No completed matchups found to export.',
          variant: 'destructive',
        });
        return;
      }

      const finalCsvData = exportOptions
        ? addExportOptionsToCSV(csvData, exportOptions, league.name)
        : csvData;

      downloadCSV(finalCsvData, `${league.name}_matchups_export.csv`);

      toast({
        title: 'Matchups exported',
        description: `Exported ${csvData.length - 1} matchup results across ${matchupsByWeek.size} weeks.`,
      });
    } catch (error) {
      console.error('Error exporting matchups:', error);
      toast({
        title: 'Export failed',
        description: 'Failed to export matchup data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <ExportButton
      onClick={exportMatchupsToCSV}
      disabled={exporting}
      icon={Swords}
      title={exporting ? 'Exporting…' : 'Export Matchups'}
      description="Weekly matchup results with scores and winners"
      colorClass="text-orange-600"
      hoverColorClass="hover:bg-orange-700"
    />
  );
};

export default MatchupsExport;

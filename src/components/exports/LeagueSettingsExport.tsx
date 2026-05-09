import React from 'react';
import { Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { downloadCSV, addExportOptionsToCSV, ExportOptionsData } from '@/utils/csvExport';
import { useLeagueSettings } from '@/hooks/useLeagueSettings';
import {
  buildLeagueInfoCsv,
  buildScoringSettingsCsv,
  buildRosterPositionsCsv,
} from '@/utils/leagueExportData';
import ExportButton from './ExportButton';

interface LeagueSettingsExportProps {
  league: any;
  exportOptions?: ExportOptionsData;
  rosters?: any[];
}

const LeagueSettingsExport: React.FC<LeagueSettingsExportProps> = ({
  league,
  exportOptions,
  rosters = [],
}) => {
  const { toast } = useToast();
  const { settings: dbSettings } = useLeagueSettings(league.league_id);

  const exportSettingsToCSV = () => {
    // Concatenate the three settings tables with a blank-row separator so
    // the file stays one-column-aligned and human-readable while still
    // being valid CSV. Spreadsheet apps will treat each section as its
    // own contiguous block.
    const sections: Array<[string, string[][]]> = [
      ['# League info', buildLeagueInfoCsv({ league, rosters, dbSettings })],
      ['# Roster positions', buildRosterPositionsCsv(league)],
      ['# Scoring settings', buildScoringSettingsCsv(league)],
    ];

    const csvData: string[][] = [];
    sections.forEach(([heading, rows], index) => {
      if (index > 0) csvData.push([]);
      csvData.push([heading]);
      rows.forEach((row) => csvData.push(row));
    });

    const finalCsvData = exportOptions
      ? addExportOptionsToCSV(csvData, exportOptions, league.name)
      : csvData;

    downloadCSV(finalCsvData, `${league.name}_settings_export.csv`);

    toast({
      title: 'Settings exported',
      description: 'Scoring, roster positions, and league configuration downloaded.',
    });
  };

  return (
    <ExportButton
      onClick={exportSettingsToCSV}
      icon={Settings}
      title="Export Settings"
      description="Scoring rules, roster positions, and league configuration"
      colorClass="text-indigo-600"
      hoverColorClass="hover:bg-indigo-700"
    />
  );
};

export default LeagueSettingsExport;

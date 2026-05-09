import React from 'react';
import { Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { downloadCSV, addExportOptionsToCSV, ExportOptionsData } from '@/utils/csvExport';
import { useLeagueSettings } from '@/hooks/useLeagueSettings';
import ExportButton from './ExportButton';
import { logger } from '@/utils/logger';

interface LeagueSettingsExportProps {
  league: any;
  exportOptions?: ExportOptionsData;
}

const LeagueSettingsExport: React.FC<LeagueSettingsExportProps> = ({
  league,
  exportOptions
}) => {
  const { toast } = useToast();
  const { settings: dbSettings } = useLeagueSettings(league.league_id);

  const exportSettingsToCSV = () => {
    logger.debug('Preparing League Settings CSV export...');
    
    const csvData: string[][] = [];
    
    // League Basic Info
    csvData.push(['=== LEAGUE INFORMATION ===']);
    csvData.push(['Setting', 'Value']);
    csvData.push(['League Name', league.name || 'Unknown']);
    csvData.push(['League ID', league.league_id || 'Unknown']);
    csvData.push(['Season', league.season || 'Unknown']);
    csvData.push(['Sport', league.sport || 'nfl']);
    csvData.push(['Status', league.status || 'Unknown']);
    csvData.push(['Total Rosters', String(league.total_rosters || 0)]);
    csvData.push(['League Type', league.settings?.type === 2 ? 'Dynasty' : 'Redraft']);
    csvData.push([]);
    
    // Roster Settings
    csvData.push(['=== ROSTER SETTINGS ===']);
    csvData.push(['Position', 'Slots']);
    const rosterPositions = league.roster_positions || [];
    const positionCounts: Record<string, number> = {};
    rosterPositions.forEach((pos: string) => {
      positionCounts[pos] = (positionCounts[pos] || 0) + 1;
    });
    Object.entries(positionCounts).forEach(([pos, count]) => {
      csvData.push([pos, String(count)]);
    });
    csvData.push([]);
    
    // Scoring Settings
    csvData.push(['=== SCORING SETTINGS ===']);
    csvData.push(['Category', 'Points']);
    const scoringSettings = league.scoring_settings || {};
    const scoringLabels: Record<string, string> = {
      pass_yd: 'Passing Yards',
      pass_td: 'Passing TD',
      pass_int: 'Interception',
      rush_yd: 'Rushing Yards',
      rush_td: 'Rushing TD',
      rec: 'Reception',
      rec_yd: 'Receiving Yards',
      rec_td: 'Receiving TD',
      fum_lost: 'Fumble Lost',
      bonus_rec_te: 'TE Premium',
      st_td: 'Special Teams TD',
      def_td: 'Defensive TD',
      sack: 'Sack',
      int: 'Interception (DEF)',
      fum_rec: 'Fumble Recovery',
      safe: 'Safety',
      pts_allow_0: 'Points Allowed 0',
      pts_allow_1_6: 'Points Allowed 1-6',
      pts_allow_7_13: 'Points Allowed 7-13',
      pts_allow_14_20: 'Points Allowed 14-20',
      pts_allow_21_27: 'Points Allowed 21-27',
      pts_allow_28_34: 'Points Allowed 28-34',
      pts_allow_35p: 'Points Allowed 35+'
    };
    
    Object.entries(scoringSettings).forEach(([key, value]) => {
      if (value !== 0) {
        const label = scoringLabels[key] || key;
        csvData.push([label, String(value)]);
      }
    });
    csvData.push([]);
    
    // Salary Cap Settings (from Supabase)
    if (dbSettings) {
      csvData.push(['=== SALARY CAP SETTINGS ===']);
      csvData.push(['Setting', 'Value']);
      csvData.push(['Salary Cap', dbSettings.salary_cap ? `$${dbSettings.salary_cap.toLocaleString()}` : 'Not Set']);
      csvData.push(['FAAB Budget', dbSettings.faab_cap ? `$${dbSettings.faab_cap}` : 'Not Set']);
      csvData.push(['Dead Cap Enabled', dbSettings.dead_cap_enabled ? 'Yes' : 'No']);
      csvData.push(['IR/Reserve Limit', dbSettings.reserve_limit ? String(dbSettings.reserve_limit) : 'Not Set']);
      csvData.push([]);
    }
    
    // Playoff Settings
    csvData.push(['=== PLAYOFF SETTINGS ===']);
    csvData.push(['Setting', 'Value']);
    csvData.push(['Playoff Teams', String(league.settings?.playoff_teams || 6)]);
    csvData.push(['Playoff Start Week', String(league.settings?.playoff_week_start || 15)]);
    csvData.push(['Playoff Round Type', league.settings?.playoff_round_type === 1 ? '1 Week per Round' : '2 Weeks per Round']);
    csvData.push([]);
    
    // Trade/Waiver Settings
    csvData.push(['=== TRADE & WAIVER SETTINGS ===']);
    csvData.push(['Setting', 'Value']);
    csvData.push(['Trade Deadline', league.settings?.trade_deadline ? `Week ${league.settings.trade_deadline}` : 'None']);
    csvData.push(['Trade Review Period', league.settings?.trade_review_days ? `${league.settings.trade_review_days} days` : 'Instant']);
    csvData.push(['Waiver Type', league.settings?.waiver_type === 2 ? 'FAAB' : league.settings?.waiver_type === 1 ? 'Rolling' : 'Standard']);
    csvData.push(['Waiver Day of Week', getDayName(league.settings?.waiver_day_of_week)]);

    // Add export options if provided
    const finalCsvData = exportOptions 
      ? addExportOptionsToCSV(csvData, exportOptions, league.name)
      : csvData;

    downloadCSV(finalCsvData, `${league.name}_settings_export.csv`);
    
    toast({
      title: "League Settings Export Complete!",
      description: "Scoring, roster, and league configuration have been downloaded"
    });
  };

  const getDayName = (dayNum: number | undefined): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return dayNum !== undefined && days[dayNum] ? days[dayNum] : 'Wednesday';
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

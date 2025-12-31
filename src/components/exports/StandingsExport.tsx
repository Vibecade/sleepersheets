import React from 'react';
import { Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { downloadCSV, addExportOptionsToCSV, ExportOptionsData } from '@/utils/csvExport';
import { getTeamName } from '@/utils/leagueDataUtils';
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
  exportOptions
}) => {
  const { toast } = useToast();

  const exportStandingsToCSV = () => {
    console.log('Preparing Standings CSV export...');
    
    const csvData: string[][] = [];
    const headers = [
      'Rank',
      'Team Name',
      'Owner',
      'Wins',
      'Losses',
      'Ties',
      'Win %',
      'Points For',
      'Points Against',
      'Point Differential'
    ];
    
    csvData.push(headers);

    // Sort rosters by win percentage, then by points for
    const sortedRosters = [...rosters].sort((a, b) => {
      const aWins = a.settings?.wins || 0;
      const bWins = b.settings?.wins || 0;
      const aLosses = a.settings?.losses || 0;
      const bLosses = b.settings?.losses || 0;
      
      const aWinPct = aWins + aLosses > 0 ? aWins / (aWins + aLosses) : 0;
      const bWinPct = bWins + bLosses > 0 ? bWins / (bWins + bLosses) : 0;
      
      if (aWinPct !== bWinPct) {
        return bWinPct - aWinPct;
      }
      
      const aPts = a.settings?.fpts || 0;
      const bPts = b.settings?.fpts || 0;
      return bPts - aPts;
    });

    sortedRosters.forEach((roster, index) => {
      const user = userMap[roster.owner_id];
      const teamName = getTeamName(user);
      const ownerName = user?.display_name || user?.username || 'Unknown';
      
      const wins = roster.settings?.wins || 0;
      const losses = roster.settings?.losses || 0;
      const ties = roster.settings?.ties || 0;
      const gamesPlayed = wins + losses + ties;
      const winPct = gamesPlayed > 0 ? ((wins + (ties * 0.5)) / gamesPlayed * 100).toFixed(1) : '0.0';
      const pointsFor = roster.settings?.fpts || 0;
      const pointsAgainst = roster.settings?.fpts_against || 0;
      const pointDiff = pointsFor - pointsAgainst;
      
      csvData.push([
        String(index + 1),
        teamName,
        ownerName,
        String(wins),
        String(losses),
        String(ties),
        `${winPct}%`,
        pointsFor.toFixed(2),
        pointsAgainst.toFixed(2),
        pointDiff >= 0 ? `+${pointDiff.toFixed(2)}` : pointDiff.toFixed(2)
      ]);
    });

    // Add export options if provided
    const finalCsvData = exportOptions 
      ? addExportOptionsToCSV(csvData, exportOptions, league.name)
      : csvData;

    downloadCSV(finalCsvData, `${league.name}_standings_export.csv`);
    
    toast({
      title: "Standings Export Complete!",
      description: "Team standings with win/loss records and point totals have been downloaded"
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

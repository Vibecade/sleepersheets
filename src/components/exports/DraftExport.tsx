
import React from 'react';
import { FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { downloadCSV, formatPlayerName, addExportOptionsToCSV, ExportOptionsData } from '@/utils/csvExport';
import { getTeamName } from '@/utils/leagueDataUtils';
import { usePlayerSalaries } from '@/hooks/usePlayerSalaries';
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
  exportOptions
}) => {
  const { toast } = useToast();
  const { salaries } = usePlayerSalaries(league.league_id);

  const exportDraftToCSV = () => {
    console.log('Preparing clean Draft CSV export...');
    console.log('Current salaries for draft export:', salaries);
    console.log('Export options:', exportOptions);
    
    const csvData = [];
    const headers = ['Round', 'Pick', 'Fantasy Team', 'Player Name', 'NFL Team', 'Position', 'Is Keeper', 'Fantasy Salary'];
    
    csvData.push(headers);

    draftPicks.forEach(({ draft, picks }) => {
      picks.forEach((pick: any) => {
        const player = players[pick.player_id];
        const user = rosterUserMap[pick.roster_id];
        const fantasyTeam = getTeamName(user);
        const salary = salaries[pick.player_id];
        
        console.log(`Draft Pick - Player ${player ? formatPlayerName(player) : 'Unknown'} (${pick.player_id}) salary:`, salary);
        
        csvData.push([
          pick.round || 'N/A',
          pick.pick_no || 'N/A',
          fantasyTeam,
          player ? formatPlayerName(player) : 'Unknown Player',
          player?.team || 'FA',
          player?.position || 'Unknown',
          pick.is_keeper ? 'Yes' : 'No',
          salary ? `$${salary.toLocaleString()}` : ''
        ]);
      });
    });

    // Add export options if provided
    const finalCsvData = exportOptions 
      ? addExportOptionsToCSV(csvData, exportOptions, league.name)
      : csvData;

    console.log('Final Draft CSV data with options:', finalCsvData);
    downloadCSV(finalCsvData, `${league.name}_draft_export.csv`);
    
    toast({
      title: "Clean Draft Export Complete!",
      description: "Your league draft data has been downloaded as CSV with clean formatting and fantasy salaries"
    });
  };

  return (
    <ExportButton
      onClick={exportDraftToCSV}
      disabled={draftPicks.length === 0}
      icon={FileText}
      title="Export Draft"
      description="Organized draft results with fantasy salaries"
      colorClass="text-purple-600"
      hoverColorClass="hover:bg-purple-700"
    />
  );
};

export default DraftExport;

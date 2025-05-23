
import React from 'react';
import { FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { downloadCSV, formatPlayerName } from '@/utils/csvExport';
import { getTeamName } from '@/utils/leagueDataUtils';
import ExportButton from './ExportButton';

interface DraftExportProps {
  league: any;
  draftPicks: any[];
  rosterUserMap: Record<string, any>;
  players: Record<string, any>;
}

const DraftExport: React.FC<DraftExportProps> = ({
  league,
  draftPicks,
  rosterUserMap,
  players
}) => {
  const { toast } = useToast();

  const exportDraftToCSV = () => {
    console.log('Preparing clean Draft CSV export...');
    
    const csvData = [];
    const headers = ['Round', 'Pick', 'Fantasy Team', 'Player Name', 'NFL Team', 'Position', 'Is Keeper'];
    
    csvData.push(headers);

    draftPicks.forEach(({ draft, picks }) => {
      picks.forEach((pick: any) => {
        const player = players[pick.player_id];
        const user = rosterUserMap[pick.roster_id];
        const fantasyTeam = getTeamName(user);
        
        csvData.push([
          pick.round || 'N/A',
          pick.pick_no || 'N/A',
          fantasyTeam,
          player ? formatPlayerName(player) : 'Unknown Player',
          player?.team || 'FA',
          player?.position || 'Unknown',
          pick.is_keeper ? 'Yes' : 'No'
        ]);
      });
    });

    downloadCSV(csvData, `${league.name}_draft_export.csv`);
    
    toast({
      title: "Clean Draft Export Complete!",
      description: "Your league draft data has been downloaded as CSV with clean formatting"
    });
  };

  return (
    <ExportButton
      onClick={exportDraftToCSV}
      disabled={draftPicks.length === 0}
      icon={FileText}
      title="Export Draft"
      description="Organized draft results"
      colorClass="text-purple-600"
      hoverColorClass="hover:bg-purple-700"
    />
  );
};

export default DraftExport;

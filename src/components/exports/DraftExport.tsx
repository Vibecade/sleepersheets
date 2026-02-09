import React from 'react';
import { FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { downloadCSV, formatPlayerName, addExportOptionsToCSV, ExportOptionsData, getPlayerFranchiseValue } from '@/utils/csvExport';
import { getTeamName } from '@/utils/leagueDataUtils';
import { usePlayerSalaries } from '@/hooks/usePlayerSalaries';
import { usePlayerContracts } from '@/hooks/usePlayerContracts';
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
  const { contracts } = usePlayerContracts(league.league_id);

  const exportDraftToCSV = () => {
    console.log('Preparing enhanced Draft CSV export...');
    
    const csvData: string[][] = [];
    const headers = [
      'Draft Season',
      'Draft Type',
      'Round',
      'Pick',
      'Overall Pick',
      'Fantasy Team',
      'Player Name',
      'NFL Team',
      'Position',
      'Is Keeper',
      'Fantasy Salary',
      'Contract Years',
      'Franchise Value'
    ];
    
    csvData.push(headers);

    let overallPick = 0;

    draftPicks.forEach(({ draft, picks }) => {
      const draftSeason = draft?.season || league.season || 'Unknown';
      const draftType = getDraftType(draft?.type);
      
      // Sort picks by round then pick number
      const sortedPicks = [...picks].sort((a: any, b: any) => {
        if (a.round !== b.round) return a.round - b.round;
        return a.pick_no - b.pick_no;
      });
      
      sortedPicks.forEach((pick: any) => {
        overallPick++;
        const player = players[pick.player_id];
        const user = rosterUserMap[pick.roster_id];
        const fantasyTeam = getTeamName(user);
        const salary = salaries[pick.player_id];
        const contractYears = contracts[pick.player_id];
        const franchiseValue = player ? getPlayerFranchiseValue(player) : '';
        
        csvData.push([
          draftSeason,
          draftType,
          String(pick.round || 'N/A'),
          String(pick.pick_no || 'N/A'),
          String(overallPick),
          fantasyTeam,
          player ? formatPlayerName(player) : 'Unknown Player',
          player?.team || 'FA',
          player?.position || 'Unknown',
          pick.is_keeper ? 'Yes' : 'No',
          salary ? `$${salary.toLocaleString()}` : '',
          contractYears ? `${contractYears} year${contractYears > 1 ? 's' : ''}` : '',
          franchiseValue
        ]);
      });
    });

    // Add export options if provided
    const finalCsvData = exportOptions 
      ? addExportOptionsToCSV(csvData, exportOptions, league.name)
      : csvData;

    downloadCSV(finalCsvData, `${league.name}_draft_export.csv`);
    
    toast({
      title: "Draft Export Complete!",
      description: `Exported ${overallPick} draft picks with salaries and contract details`
    });
  };

  const getDraftType = (type: string | undefined): string => {
    const types: Record<string, string> = {
      'snake': 'Snake Draft',
      'linear': 'Linear Draft',
      'auction': 'Auction Draft'
    };
    return type ? (types[type] || type) : 'Standard';
  };

  return (
    <ExportButton
      onClick={exportDraftToCSV}
      disabled={draftPicks.length === 0}
      icon={FileText}
      title="Export Draft"
      description="Draft results with keepers, salaries, and contract years"
      colorClass="text-purple-600"
      hoverColorClass="hover:bg-purple-700"
    />
  );
};

export default DraftExport;

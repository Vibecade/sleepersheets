import React, { useState } from 'react';
import { Swords } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { downloadCSV, addExportOptionsToCSV, ExportOptionsData } from '@/utils/csvExport';
import { getTeamName } from '@/utils/leagueDataUtils';
import { cachedFetch } from '@/utils/apiCache';
import ExportButton from './ExportButton';
import { logger } from '@/utils/logger';

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
  exportOptions
}) => {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);

  const getRosterUserMap = () => {
    const map: Record<number, any> = {};
    rosters.forEach(roster => {
      map[roster.roster_id] = userMap[roster.owner_id];
    });
    return map;
  };

  const exportMatchupsToCSV = async () => {
    setExporting(true);
    logger.debug('Preparing Matchups CSV export...');
    
    try {
      const csvData: string[][] = [];
      const headers = [
        'Week',
        'Team 1',
        'Team 1 Score',
        'Team 2',
        'Team 2 Score',
        'Winner',
        'Point Margin'
      ];
      
      csvData.push(headers);
      
      const rosterUserMap = getRosterUserMap();
      
      // Determine current week from league status
      const currentWeek = league.settings?.leg || 1;
      const maxWeeks = Math.min(currentWeek, 18); // Regular season max
      
      // Fetch all weeks' matchups
      for (let week = 1; week <= maxWeeks; week++) {
        try {
          const matchups = await cachedFetch<Matchup[]>(
            `https://api.sleeper.app/v1/league/${league.league_id}/matchups/${week}`,
            {},
            5 * 60 * 1000
          );
          
          if (!matchups || matchups.length === 0) continue;
          
          // Group by matchup_id
          const matchupGroups: Record<number, Matchup[]> = {};
          matchups.forEach(m => {
            if (!matchupGroups[m.matchup_id]) {
              matchupGroups[m.matchup_id] = [];
            }
            matchupGroups[m.matchup_id].push(m);
          });
          
          // Process each matchup pair
          Object.values(matchupGroups).forEach(pair => {
            if (pair.length !== 2) return;
            
            const [team1, team2] = pair;
            const user1 = rosterUserMap[team1.roster_id];
            const user2 = rosterUserMap[team2.roster_id];
            const team1Name = getTeamName(user1);
            const team2Name = getTeamName(user2);
            const team1Score = team1.points || 0;
            const team2Score = team2.points || 0;
            
            let winner = 'Tie';
            if (team1Score > team2Score) winner = team1Name;
            else if (team2Score > team1Score) winner = team2Name;
            
            const margin = Math.abs(team1Score - team2Score);
            
            csvData.push([
              String(week),
              team1Name,
              team1Score.toFixed(2),
              team2Name,
              team2Score.toFixed(2),
              winner,
              margin.toFixed(2)
            ]);
          });
        } catch (err) {
          logger.warn(`Failed to fetch week ${week} matchups:`, err);
        }
      }

      if (csvData.length <= 1) {
        toast({
          title: "No Matchup Data",
          description: "No completed matchups found to export",
          variant: "destructive"
        });
        return;
      }

      // Add export options if provided
      const finalCsvData = exportOptions 
        ? addExportOptionsToCSV(csvData, exportOptions, league.name)
        : csvData;

      downloadCSV(finalCsvData, `${league.name}_matchups_export.csv`);
      
      toast({
        title: "Matchups Export Complete!",
        description: `Exported ${csvData.length - 1} matchup results from ${maxWeeks} weeks`
      });
    } catch (error) {
      logger.error('Error exporting matchups:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export matchup data",
        variant: "destructive"
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
      title={exporting ? "Exporting..." : "Export Matchups"}
      description="Weekly matchup results with scores and winners"
      colorClass="text-orange-600"
      hoverColorClass="hover:bg-orange-700"
    />
  );
};

export default MatchupsExport;

import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { downloadCSV, formatPlayerName, getPlayerFranchiseValue, formatDate, formatCurrency, getDataTimestamp, sanitizeFilename } from '@/utils/csvExport';
import { getTeamName } from '@/utils/leagueDataUtils';
import { usePlayerSalaries } from '@/hooks/usePlayerSalaries';
import { usePlayerContracts } from '@/hooks/usePlayerContracts';
import { useDeadCapPlayers } from '@/hooks/useDeadCapPlayers';
import { useLeagueSettings } from '@/hooks/useLeagueSettings';
import { useFAABCalculations } from '@/hooks/useFAABCalculations';
import { cachedFetch } from '@/utils/apiCache';

interface ExportAllProps {
  league: any;
  rosters: any[];
  userMap: Record<string, any>;
  rosterUserMap: Record<string, any>;
  players: Record<string, any>;
  transactions: any[];
  draftPicks: any[];
}

interface Matchup {
  roster_id: number;
  matchup_id: number;
  points: number;
}

const ExportAll: React.FC<ExportAllProps> = ({
  league,
  rosters,
  userMap,
  rosterUserMap,
  players,
  transactions,
  draftPicks
}) => {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const { salaries, taxiSquadStatus, getSalaryCapContribution } = usePlayerSalaries(league.league_id);
  const { contracts } = usePlayerContracts(league.league_id);
  const { deadCapPlayers } = useDeadCapPlayers(league.league_id);
  const { settings: dbSettings } = useLeagueSettings(league.league_id);
  const { teamFAAB, getPlayerFAABCost } = useFAABCalculations({ 
    rosters,
    leagueId: league.league_id, 
    transactions 
  });

  const exportAllData = async () => {
    setExporting(true);
    toast({
      title: "Preparing Export",
      description: "Gathering all league data into a single file..."
    });

    try {
      const csvData = await generateComprehensiveCSV();
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = sanitizeFilename(`${league.name}_Complete_Export_${dateStr}.csv`);
      downloadCSV(csvData, filename);

      toast({
        title: "Export Complete!",
        description: "Complete league data has been downloaded as a single CSV file"
      });
    } catch (error) {
      console.error('Error exporting all data:', error);
      toast({
        title: "Export Failed",
        description: "Failed to generate export. Please try again.",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  const generateComprehensiveCSV = async (): Promise<string[][]> => {
    const csvData: string[][] = [];
    
    // === HEADER ===
    csvData.push(['=== COMPLETE LEAGUE DATA EXPORT ===']);
    csvData.push([`Generated: ${getDataTimestamp()}`]);
    csvData.push([]);

    // === LEAGUE INFORMATION ===
    csvData.push(['=== LEAGUE INFORMATION ===']);
    csvData.push(['Setting', 'Value']);
    csvData.push(['League Name', league.name || 'Unknown']);
    csvData.push(['League ID', league.league_id || 'Unknown']);
    csvData.push(['Season', league.season || 'Unknown']);
    csvData.push(['Sport', league.sport || 'nfl']);
    csvData.push(['Total Teams', String(league.total_rosters || rosters.length || 0)]);
    csvData.push(['League Type', league.settings?.type === 2 ? 'Dynasty' : 'Redraft']);
    csvData.push(['Status', league.status || 'Unknown']);
    if (dbSettings) {
      csvData.push(['Salary Cap', formatCurrency(dbSettings.salary_cap) || '$200,000']);
      csvData.push(['FAAB Budget', formatCurrency(dbSettings.faab_cap) || '$100']);
      csvData.push(['Dead Cap Enabled', dbSettings.dead_cap_enabled ? 'Yes' : 'No']);
      csvData.push(['Reserve Limit', dbSettings.reserve_limit ? String(dbSettings.reserve_limit) : 'Not Set']);
    }
    csvData.push([]);

    // === TEAM SUMMARIES (STANDINGS + FAAB + SALARY) ===
    csvData.push(['=== TEAM SUMMARIES ===']);
    csvData.push(['Rank', 'Team Name', 'Owner', 'Wins', 'Losses', 'Ties', 'Win %', 'Points For', 'Points Against', 'Total Salary', 'Cap Space', 'FAAB Spent', 'FAAB Remaining']);
    
    const salaryCap = dbSettings?.salary_cap || 200000;
    const sortedRosters = [...rosters].sort((a, b) => {
      const aWins = a.settings?.wins || 0;
      const bWins = b.settings?.wins || 0;
      const aWinPct = (aWins + (a.settings?.losses || 0)) > 0 ? aWins / (aWins + (a.settings?.losses || 0)) : 0;
      const bWinPct = (bWins + (b.settings?.losses || 0)) > 0 ? bWins / (bWins + (b.settings?.losses || 0)) : 0;
      if (aWinPct !== bWinPct) return bWinPct - aWinPct;
      return (b.settings?.fpts || 0) - (a.settings?.fpts || 0);
    });

    sortedRosters.forEach((roster, index) => {
      const user = userMap[roster.owner_id];
      const wins = roster.settings?.wins || 0;
      const losses = roster.settings?.losses || 0;
      const ties = roster.settings?.ties || 0;
      const gamesPlayed = wins + losses + ties;
      const winPct = gamesPlayed > 0 ? ((wins + (ties * 0.5)) / gamesPlayed * 100).toFixed(1) : '0.0';
      const pointsFor = roster.settings?.fpts || 0;
      const pointsAgainst = roster.settings?.fpts_against || 0;
      
      // Calculate team salary
      const allPlayerIds = [...(roster.players || []), ...(roster.taxi || [])];
      const totalSalary = allPlayerIds.reduce((total, playerId) => {
        return total + getSalaryCapContribution(playerId);
      }, 0);
      
      // Add dead cap
      const deadCap = deadCapPlayers
        .filter(p => p.roster_id === roster.roster_id)
        .reduce((total, p) => total + Math.max(1, Math.round((p.salary || 0) * 0.25)), 0);
      
      const totalWithDeadCap = totalSalary + deadCap;
      const capSpace = salaryCap - totalWithDeadCap;
      
      const faabData = teamFAAB[roster.roster_id] || { spent: 0, available: 0 };
      
      csvData.push([
        String(index + 1),
        getTeamName(user),
        user?.display_name || user?.username || 'Unknown',
        String(wins),
        String(losses),
        String(ties),
        `${winPct}%`,
        pointsFor.toFixed(2),
        pointsAgainst.toFixed(2),
        formatCurrency(totalWithDeadCap),
        formatCurrency(capSpace),
        formatCurrency(faabData.spent),
        formatCurrency(faabData.available)
      ]);
    });
    csvData.push([]);

    // === FULL ROSTERS WITH CONTRACTS ===
    csvData.push(['=== FULL ROSTERS WITH CONTRACTS ===']);
    csvData.push(['Team', 'Player Name', 'NFL Team', 'Position', 'Roster Status', 'Salary', 'Taxi Discount', 'Cap Hit', 'Contract Years', 'Acquisition Type', 'FAAB Cost', 'Franchise Value']);

    rosters.forEach((roster) => {
      const user = userMap[roster.owner_id];
      const fantasyTeam = getTeamName(user);

      const playerCategories = [
        { players: roster.players || [], status: 'Active' },
        { players: roster.reserve || [], status: 'Reserve' },
        { players: roster.taxi || [], status: 'Taxi Squad' }
      ];

      playerCategories.forEach(({ players: playerList, status }) => {
        playerList.forEach((playerId: string) => {
          const player = players[playerId];
          if (player) {
            const salary = salaries[playerId] || 0;
            const contractYears = contracts[playerId];
            const isTaxi = taxiSquadStatus[playerId] || status === 'Taxi Squad';
            const taxiDiscount = isTaxi ? Math.round(salary * 0.25) : 0;
            const capHit = getSalaryCapContribution(playerId);
            const faabCost = getPlayerFAABCost(playerId, roster.roster_id);
            const franchiseValue = getPlayerFranchiseValue(player);
            const acquisitionType = faabCost > 0 ? 'faab' : 'contract';
            
            csvData.push([
              fantasyTeam,
              formatPlayerName(player),
              player.team || 'FA',
              player.position || 'Unknown',
              status,
              formatCurrency(salary),
              taxiDiscount > 0 ? `-${formatCurrency(taxiDiscount)}` : '',
              formatCurrency(capHit),
              contractYears ? String(contractYears) : '',
              acquisitionType,
              faabCost > 0 ? formatCurrency(faabCost) : '',
              franchiseValue
            ]);
          }
        });
      });
    });
    csvData.push([]);

    // === DEAD CAP OBLIGATIONS ===
    if (deadCapPlayers.length > 0) {
      csvData.push(['=== DEAD CAP OBLIGATIONS ===']);
      csvData.push(['Team', 'Player Name', 'Original Salary', 'Dead Cap Amount (25%)']);
      
      deadCapPlayers.forEach((deadCapPlayer) => {
        const player = players[deadCapPlayer.player_id];
        const roster = rosters.find(r => r.roster_id === deadCapPlayer.roster_id);
        const user = roster ? userMap[roster.owner_id] : null;
        const fantasyTeam = user ? getTeamName(user) : 'Unknown Team';
        const deadCapAmount = Math.max(1, Math.round((deadCapPlayer.salary || 0) * 0.25));

        csvData.push([
          fantasyTeam,
          player ? formatPlayerName(player) : `Player ID: ${deadCapPlayer.player_id}`,
          formatCurrency(deadCapPlayer.salary),
          formatCurrency(deadCapAmount)
        ]);
      });
      csvData.push([]);
    }

    // === TRANSACTIONS (FULL SEASON) ===
    if (transactions.length > 0) {
      csvData.push(['=== TRANSACTIONS (FULL SEASON) ===']);
      csvData.push(['Date', 'Week', 'Type', 'Team', 'Player', 'NFL Team', 'Position', 'Action', 'FAAB Bid', 'Trade Partner', 'Draft Picks Traded']);

      const sortedTransactions = [...transactions].sort((a, b) => {
        const dateA = a.created || a.status_updated || 0;
        const dateB = b.created || b.status_updated || 0;
        return dateB - dateA;
      });

      sortedTransactions.forEach((transaction) => {
        const week = transaction.leg || transaction.week || '';
        const txType = transaction.type || 'unknown';
        const timestamp = transaction.created || transaction.status_updated;
        const dateStr = timestamp ? formatDate(timestamp) : '';
        
        // Get trade partner for trades
        let tradePartner = '';
        if (txType === 'trade' && transaction.roster_ids?.length === 2) {
          const [roster1, roster2] = transaction.roster_ids;
          const user1 = rosterUserMap[roster1];
          const user2 = rosterUserMap[roster2];
          tradePartner = `${getTeamName(user1)} ↔ ${getTeamName(user2)}`;
        }
        
        // Get draft picks traded
        let draftPicksTraded = '';
        if (transaction.draft_picks && Array.isArray(transaction.draft_picks) && transaction.draft_picks.length > 0) {
          draftPicksTraded = transaction.draft_picks.map((pick: any) => 
            `${pick.season} Round ${pick.round}`
          ).join('; ');
        }

        // Process drops
        if (transaction.drops) {
          Object.entries(transaction.drops as Record<string, number>).forEach(([playerId, rosterId]) => {
            const player = players[playerId];
            const user = rosterUserMap[rosterId];
            csvData.push([
              dateStr,
              String(week),
              txType,
              getTeamName(user),
              player ? formatPlayerName(player) : `Player ID: ${playerId}`,
              player?.team || 'FA',
              player?.position || 'Unknown',
              'Drop',
              '',
              tradePartner,
              draftPicksTraded
            ]);
          });
        }

        // Process adds
        if (transaction.adds) {
          Object.entries(transaction.adds as Record<string, number>).forEach(([playerId, rosterId]) => {
            const player = players[playerId];
            const user = rosterUserMap[rosterId];
            const faabBid = transaction.settings?.waiver_bid;
            
            csvData.push([
              dateStr,
              String(week),
              txType,
              getTeamName(user),
              player ? formatPlayerName(player) : `Player ID: ${playerId}`,
              player?.team || 'FA',
              player?.position || 'Unknown',
              'Add',
              faabBid ? formatCurrency(faabBid) : '',
              tradePartner,
              draftPicksTraded
            ]);
          });
        }
      });
      csvData.push([]);
    }

    // === DRAFT HISTORY ===
    if (draftPicks.length > 0) {
      csvData.push(['=== DRAFT HISTORY ===']);
      csvData.push(['Draft Year', 'Round', 'Pick #', 'Team', 'Player Name', 'NFL Team', 'Position', 'Is Keeper', 'Salary', 'Contract Years', 'Franchise Value']);

      draftPicks.forEach(({ draft, picks }) => {
        const draftYear = draft?.season || league.season || 'Unknown';
        
        picks.forEach((pick: any) => {
          const player = players[pick.player_id];
          const user = rosterUserMap[pick.roster_id];
          
          csvData.push([
            String(draftYear),
            String(pick.round || ''),
            String(pick.pick_no || ''),
            getTeamName(user),
            player ? formatPlayerName(player) : 'Unknown Player',
            player?.team || 'FA',
            player?.position || 'Unknown',
            pick.is_keeper ? 'Yes' : 'No',
            salaries[pick.player_id] ? formatCurrency(salaries[pick.player_id]) : '',
            contracts[pick.player_id] ? String(contracts[pick.player_id]) : '',
            player ? getPlayerFranchiseValue(player) : ''
          ]);
        });
      });
      csvData.push([]);
    }

    // === MATCHUP RESULTS ===
    csvData.push(['=== MATCHUP RESULTS ===']);
    csvData.push(['Week', 'Team 1', 'Score 1', 'Team 2', 'Score 2', 'Winner', 'Point Margin']);
    
    const rosterMap: Record<number, any> = {};
    rosters.forEach(roster => {
      rosterMap[roster.roster_id] = userMap[roster.owner_id];
    });
    
    const currentWeek = league.settings?.leg || 1;
    const maxWeeks = Math.min(currentWeek, 18);
    
    for (let week = 1; week <= maxWeeks; week++) {
      try {
        const matchups = await cachedFetch<Matchup[]>(
          `https://api.sleeper.app/v1/league/${league.league_id}/matchups/${week}`,
          {},
          5 * 60 * 1000
        );
        
        if (!matchups || matchups.length === 0) continue;
        
        const matchupGroups: Record<number, Matchup[]> = {};
        matchups.forEach(m => {
          if (!matchupGroups[m.matchup_id]) matchupGroups[m.matchup_id] = [];
          matchupGroups[m.matchup_id].push(m);
        });
        
        Object.values(matchupGroups).forEach(pair => {
          if (pair.length !== 2) return;
          const [team1, team2] = pair;
          const team1Name = getTeamName(rosterMap[team1.roster_id]);
          const team2Name = getTeamName(rosterMap[team2.roster_id]);
          const team1Score = team1.points || 0;
          const team2Score = team2.points || 0;
          
          let winner = 'Tie';
          if (team1Score > team2Score) winner = team1Name;
          else if (team2Score > team1Score) winner = team2Name;
          
          csvData.push([
            String(week),
            team1Name,
            team1Score.toFixed(2),
            team2Name,
            team2Score.toFixed(2),
            winner,
            Math.abs(team1Score - team2Score).toFixed(2)
          ]);
        });
      } catch (err) {
        console.warn(`Failed to fetch week ${week}:`, err);
      }
    }
    csvData.push([]);

    // === SCORING SETTINGS ===
    if (league.scoring_settings) {
      csvData.push(['=== SCORING SETTINGS ===']);
      csvData.push(['Category', 'Points']);
      
      const scoringLabels: Record<string, string> = {
        pass_yd: 'Passing Yards (per yard)',
        pass_td: 'Passing TD',
        pass_int: 'Interception',
        rush_yd: 'Rushing Yards (per yard)',
        rush_td: 'Rushing TD',
        rec: 'Reception',
        rec_yd: 'Receiving Yards (per yard)',
        rec_td: 'Receiving TD',
        fum_lost: 'Fumble Lost',
        bonus_rec_te: 'TE Premium',
        st_td: 'Special Teams TD',
        def_td: 'Defensive TD',
        sack: 'Sack',
        int: 'Interception (DEF)',
        fum_rec: 'Fumble Recovery',
        safe: 'Safety',
        blk_kick: 'Blocked Kick',
        pts_allow_0: 'Points Allowed: 0',
        pts_allow_1_6: 'Points Allowed: 1-6',
        pts_allow_7_13: 'Points Allowed: 7-13',
        pts_allow_14_20: 'Points Allowed: 14-20',
        pts_allow_21_27: 'Points Allowed: 21-27',
        pts_allow_28_34: 'Points Allowed: 28-34',
        pts_allow_35p: 'Points Allowed: 35+'
      };
      
      Object.entries(league.scoring_settings).forEach(([key, value]) => {
        const label = scoringLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        csvData.push([label, String(value)]);
      });
      csvData.push([]);
    }

    // === ROSTER POSITIONS ===
    if (league.roster_positions) {
      csvData.push(['=== ROSTER POSITIONS ===']);
      csvData.push(['Position', 'Count']);
      
      const positionCounts: Record<string, number> = {};
      league.roster_positions.forEach((pos: string) => {
        positionCounts[pos] = (positionCounts[pos] || 0) + 1;
      });
      
      Object.entries(positionCounts).forEach(([pos, count]) => {
        csvData.push([pos, String(count)]);
      });
      csvData.push([]);
    }

    // === FOOTER ===
    csvData.push(['=== END OF EXPORT ===']);
    csvData.push([`Total Players: ${Object.keys(salaries).length}`]);
    csvData.push([`Total Transactions: ${transactions.length}`]);
    csvData.push([`Total Draft Picks: ${draftPicks.reduce((acc, d) => acc + d.picks.length, 0)}`]);

    return csvData;
  };

  return (
    <Button
      onClick={exportAllData}
      disabled={exporting}
      className="w-full h-auto py-4 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white"
    >
      <div className="flex items-center justify-center gap-3">
        {exporting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Download className="w-5 h-5" />
        )}
        <div className="text-left">
          <div className="font-semibold">
            {exporting ? "Generating Complete Export..." : "Export All League Data"}
          </div>
          <div className="text-xs opacity-80">
            Single CSV with rosters, contracts, FAAB, standings, transactions, draft & settings
          </div>
        </div>
      </div>
    </Button>
  );
};

export default ExportAll;

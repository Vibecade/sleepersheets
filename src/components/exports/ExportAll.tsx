import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import JSZip from 'jszip';
import { sanitizeFilename } from '@/utils/csvExport';
import { usePlayerSalaries } from '@/hooks/usePlayerSalaries';
import { usePlayerContracts } from '@/hooks/usePlayerContracts';
import { useDeadCapPlayers } from '@/hooks/useDeadCapPlayers';
import { useLeagueSettings } from '@/hooks/useLeagueSettings';
import { useFAABCalculations } from '@/hooks/useFAABCalculations';
import { cachedFetch } from '@/utils/apiCache';
import {
  buildLeagueInfoCsv,
  buildScoringSettingsCsv,
  buildRosterPositionsCsv,
  buildStandingsCsv,
  buildTeamSummaryCsv,
  buildRostersCsv,
  buildDeadCapCsv,
  buildTransactionsCsv,
  buildDraftCsv,
  buildMatchupsCsv,
  buildReadmeMarkdown,
  buildManifestJson,
} from '@/utils/leagueExportData';

interface ExportAllProps {
  league: any;
  rosters: any[];
  userMap: Record<string, any>;
  rosterUserMap: Record<string, any>;
  players: Record<string, any>;
  transactions: any[];
  draftPicks: any[];
}

interface SleeperMatchup {
  roster_id: number;
  matchup_id: number;
  points: number;
}

const csvFromRows = (rows: string[][]): string =>
  rows
    .map((row) =>
      row
        .map((field) => {
          const str = field === null || field === undefined ? '' : String(field);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(','),
    )
    .join('\n');

const ExportAll: React.FC<ExportAllProps> = ({
  league,
  rosters,
  userMap,
  rosterUserMap,
  players,
  transactions,
  draftPicks,
}) => {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const { salaries, taxiSquadStatus, getSalaryCapContribution } = usePlayerSalaries(
    league.league_id,
  );
  const { contracts } = usePlayerContracts(league.league_id);
  const { deadCapPlayers } = useDeadCapPlayers(league.league_id);
  const { settings: dbSettings } = useLeagueSettings(league.league_id);
  const { teamFAAB, getPlayerFAABCost } = useFAABCalculations({
    rosters,
    leagueId: league.league_id,
    transactions,
  });

  const exportAllData = async () => {
    setExporting(true);
    toast({
      title: 'Building export…',
      description: 'Pulling matchup history and packaging CSVs.',
    });

    try {
      // Fetch all weekly matchups in parallel
      const currentWeek = Number(league?.settings?.leg || 1);
      const maxWeeks = Math.min(currentWeek, 18);
      const matchupsByWeek = new Map<number, SleeperMatchup[]>();
      const weekRequests = await Promise.allSettled(
        Array.from({ length: maxWeeks }, (_, i) => i + 1).map(async (week) => {
          const weekData = await cachedFetch<SleeperMatchup[]>(
            `https://api.sleeper.app/v1/league/${league.league_id}/matchups/${week}`,
            {},
            5 * 60 * 1000,
          );
          return { week, weekData };
        }),
      );
      weekRequests.forEach((result) => {
        if (result.status === 'fulfilled' && Array.isArray(result.value.weekData)) {
          matchupsByWeek.set(result.value.week, result.value.weekData);
        }
      });

      // Build every CSV
      const salaryCap = dbSettings?.salary_cap || 200000;
      const csvFiles: Array<{
        name: string;
        description: string;
        rowCount: number;
        rows: string[][];
      }> = [
        {
          name: 'league.csv',
          description: 'League settings, season, sport, salary cap, and DB-level configuration.',
          rows: buildLeagueInfoCsv({ league, rosters, dbSettings }),
          rowCount: 0,
        },
        {
          name: 'standings.csv',
          description: 'Sorted standings with W/L, win %, points for/against, and point differential.',
          rows: buildStandingsCsv({ rosters, userMap }),
          rowCount: 0,
        },
        {
          name: 'team_summary.csv',
          description:
            'Standings + financial roll-up: total salary, cap space, FAAB spent / remaining per team.',
          rows: buildTeamSummaryCsv({
            rosters,
            userMap,
            salaryCap,
            deadCapPlayers,
            getSalaryCapContribution,
            teamFAAB,
          }),
          rowCount: 0,
        },
        {
          name: 'rosters.csv',
          description:
            'Every active / reserve / taxi / dead-cap player with salary, cap hit, contract years, and acquisition type.',
          rows: buildRostersCsv({
            rosters,
            userMap,
            players,
            salaries,
            contracts,
            deadCapPlayers,
            taxiSquadStatus,
            getSalaryCapContribution,
            getPlayerFAABCost,
          }),
          rowCount: 0,
        },
        {
          name: 'dead_cap.csv',
          description: 'Dead-cap obligations per team (25% of original salary).',
          rows: buildDeadCapCsv({ deadCapPlayers, rosters, userMap, players }),
          rowCount: 0,
        },
        {
          name: 'transactions.csv',
          description:
            'Full-season transaction log: adds, drops, trades, FAAB bids, traded picks. Sorted newest first.',
          rows: buildTransactionsCsv({ transactions, players, rosterUserMap, salaries }),
          rowCount: 0,
        },
        {
          name: 'draft.csv',
          description: 'Complete draft history with rounds, picks, keepers, and post-draft salaries.',
          rows: buildDraftCsv({ draftPicks, league, players, rosterUserMap, salaries, contracts }),
          rowCount: 0,
        },
        {
          name: 'matchups.csv',
          description: `Week-by-week head-to-head results (weeks 1–${maxWeeks}).`,
          rows: buildMatchupsCsv({ matchupsByWeek, rosters, userMap }),
          rowCount: 0,
        },
        {
          name: 'scoring_settings.csv',
          description: 'Raw Sleeper scoring keys mapped to point values.',
          rows: buildScoringSettingsCsv(league),
          rowCount: 0,
        },
        {
          name: 'roster_positions.csv',
          description: 'Roster slot counts (QB, RB, WR, TE, FLEX, BN, IR, …).',
          rows: buildRosterPositionsCsv(league),
          rowCount: 0,
        },
      ];

      // Compute row counts (excluding header rows) for the manifest
      csvFiles.forEach((file) => {
        file.rowCount = Math.max(0, file.rows.length - 1);
      });

      const manifestFiles = csvFiles
        .filter((f) => f.rowCount > 0 || f.name === 'league.csv')
        .map((f) => ({ name: f.name, description: f.description, rowCount: f.rowCount }));

      // Pack everything into a ZIP
      const zip = new JSZip();
      csvFiles.forEach((file) => {
        // Skip empty optional files (dead_cap when there's no dead cap, draft when empty, etc.)
        const hasContent = file.rowCount > 0;
        const isAlwaysIncluded = ['league.csv', 'standings.csv', 'rosters.csv', 'team_summary.csv', 'scoring_settings.csv', 'roster_positions.csv'].includes(file.name);
        if (!hasContent && !isAlwaysIncluded) return;
        zip.file(file.name, csvFromRows(file.rows));
      });
      zip.file('README.md', buildReadmeMarkdown({ league, files: manifestFiles }));
      zip.file('manifest.json', buildManifestJson({ league, files: manifestFiles }));

      const blob = await zip.generateAsync({ type: 'blob' });
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = sanitizeFilename(`${league.name}_export_${dateStr}.zip`);
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Export ready',
        description: `${manifestFiles.length} CSVs + README packaged into ${filename}.`,
      });
    } catch (error) {
      console.error('Error exporting all data:', error);
      toast({
        title: 'Export failed',
        description:
          error instanceof Error ? error.message : 'Failed to generate export. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
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
            {exporting ? 'Building export…' : 'Export All League Data'}
          </div>
          <div className="text-xs opacity-80">
            ZIP with rosters, transactions, draft, standings, matchups, scoring &amp; a README.
          </div>
        </div>
      </div>
    </Button>
  );
};

export default ExportAll;

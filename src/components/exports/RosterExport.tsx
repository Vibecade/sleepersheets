import React from 'react';
import { Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { downloadCSV, addExportOptionsToCSV, ExportOptionsData } from '@/utils/csvExport';
import { usePlayerSalaries } from '@/hooks/usePlayerSalaries';
import { usePlayerContracts } from '@/hooks/usePlayerContracts';
import { useDeadCapPlayers } from '@/hooks/useDeadCapPlayers';
import { useFAABCalculations } from '@/hooks/useFAABCalculations';
import { buildRostersCsv } from '@/utils/leagueExportData';
import ExportButton from './ExportButton';

interface RosterExportProps {
  league: any;
  rosters: any[];
  userMap: Record<string, any>;
  players: Record<string, any>;
  exportOptions?: ExportOptionsData;
  transactions?: any[];
}

const RosterExport: React.FC<RosterExportProps> = ({
  league,
  rosters,
  userMap,
  players,
  exportOptions,
  transactions = [],
}) => {
  const { toast } = useToast();
  const { salaries, taxiSquadStatus, getSalaryCapContribution } = usePlayerSalaries(
    league.league_id,
  );
  const { contracts } = usePlayerContracts(league.league_id);
  const { deadCapPlayers } = useDeadCapPlayers(league.league_id);
  const { getPlayerFAABCost } = useFAABCalculations({
    rosters,
    leagueId: league.league_id,
    transactions,
  });

  const exportRostersToCSV = () => {
    const csvData = buildRostersCsv({
      rosters,
      userMap,
      players,
      salaries,
      contracts,
      deadCapPlayers,
      taxiSquadStatus,
      getSalaryCapContribution,
      getPlayerFAABCost,
    });

    const finalCsvData = exportOptions
      ? addExportOptionsToCSV(csvData, exportOptions, league.name)
      : csvData;

    downloadCSV(finalCsvData, `${league.name}_rosters_export.csv`);

    toast({
      title: 'Rosters exported',
      description: 'Players with salaries, contracts, FAAB cost, and franchise values downloaded.',
    });
  };

  return (
    <ExportButton
      onClick={exportRostersToCSV}
      icon={Users}
      title="Export Rosters"
      description="Players with salaries, contract years, and franchise values"
      colorClass="text-green-600"
      hoverColorClass="hover:bg-green-700"
    />
  );
};

export default RosterExport;

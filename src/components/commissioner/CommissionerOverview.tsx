import { useMemo, useState } from 'react';
import { TurfPanel } from '@/components/ui/turf-panel';
import { AutopilotActivityFeed } from './AutopilotActivityFeed';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { usePlayerSalaries } from '@/hooks/usePlayerSalaries';
import { usePlayerContracts } from '@/hooks/usePlayerContracts';
import { useFAABCalculations } from '@/hooks/useFAABCalculations';
import { useLeagueSettings } from '@/hooks/useLeagueSettings';
import { useDeadCapPlayers } from '@/hooks/useDeadCapPlayers';
import { CommissionerAuditLog } from './CommissionerAuditLog';
import { getTeamName, normalizeUsersToMap } from '@/utils/leagueDataUtils';
import { formatCurrency } from '@/utils/csvExport';
import { cn } from '@/lib/utils';
import type {
  CommissionerLeagueData,
  SleeperPlayer,
  SleeperRoster,
  SleeperTransaction,
} from '@/types/sleeper';

interface CommissionerOverviewProps {
  leagueId: string;
  leagueData: CommissionerLeagueData;
}

type SortKey = 'team' | 'salary' | 'capPct' | 'faabAvail' | 'contracts' | 'expiring' | 'deadCap';

const StatLine = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div>
    <div
      className="font-mono text-muted-foreground"
      style={{ fontSize: 9, letterSpacing: '0.18em' }}
    >
      {label}
    </div>
    <div className="font-headline font-bold text-foreground mt-1" style={{ fontSize: 24, lineHeight: 1 }}>
      {value}
    </div>
    {sub && (
      <div className="font-mono text-muted-foreground mt-1" style={{ fontSize: 10 }}>
        {sub}
      </div>
    )}
  </div>
);

const CapBar = ({ used, total }: { used: number; total: number }) => {
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const tone =
    pct >= 100 ? 'bg-destructive' : pct >= 90 ? 'bg-secondary' : 'bg-primary';
  return (
    <div
      className="h-1.5 w-full overflow-hidden"
      style={{ background: 'hsl(var(--card-light))' }}
    >
      <div className={cn('h-full', tone)} style={{ width: `${pct}%` }} />
    </div>
  );
};

export const CommissionerOverview = ({ leagueId, leagueData }: CommissionerOverviewProps) => {
  const rosters: SleeperRoster[] = useMemo(
    () => leagueData?.rosters || [],
    [leagueData?.rosters]
  );
  const players: Record<string, SleeperPlayer> = useMemo(
    () => leagueData?.players || {},
    [leagueData?.players]
  );
  const transactions: SleeperTransaction[] = useMemo(
    () => leagueData?.transactions || [],
    [leagueData?.transactions]
  );

  // `leagueDataForExport` ships users as Object.values(userMap) — an array.
  // Normalize defensively so map-keyed lookups (`userMap[ownerId]`) don't
  // silently return undefined; that pattern was the UserManagement bug
  // and the TransactionManagement creator-name bug.
  const userMap = useMemo(
    () => normalizeUsersToMap(leagueData?.users),
    [leagueData?.users]
  );

  const { settings, loading: settingsLoading } = useLeagueSettings(leagueId);
  const { salaries, getSalaryCapContribution, loading: salariesLoading } = usePlayerSalaries(leagueId);
  const { contracts, loading: contractsLoading } = usePlayerContracts(leagueId);
  const { deadCapPlayers, loading: deadCapLoading } = useDeadCapPlayers(leagueId);
  const { teamFAAB } = useFAABCalculations({ rosters, leagueId, transactions });

  const loading = settingsLoading || salariesLoading || contractsLoading || deadCapLoading;

  const salaryCap = settings?.salary_cap || 200000;
  const faabCap = settings?.faab_cap || 100;

  const teamRows = useMemo(() => {
    return rosters.map((roster) => {
      const owner = userMap[roster.owner_id];
      const teamName = getTeamName(owner);
      const ownerName = owner?.display_name || owner?.username || '—';
      const playerIds: string[] = [...(roster.players || []), ...(roster.taxi || [])];

      const totalSalary = playerIds.reduce(
        (sum, pid) => sum + (getSalaryCapContribution(pid) || 0),
        0,
      );

      const teamDeadCap = deadCapPlayers
        .filter((p) => p.roster_id === roster.roster_id)
        .reduce((sum, p) => sum + Math.max(1, Math.round((p.salary || 0) * 0.25)), 0);

      const totalWithDeadCap = totalSalary + teamDeadCap;
      const capPct = salaryCap > 0 ? (totalWithDeadCap / salaryCap) * 100 : 0;

      const activeContracts = playerIds.filter((pid) => {
        const len = contracts[pid];
        return typeof len === 'number' && len > 0;
      });

      const expiringPlayerIds = playerIds.filter((pid) => contracts[pid] === 1);

      const faab = teamFAAB[roster.roster_id] || { available: 0, spent: 0, total: faabCap };

      return {
        roster_id: roster.roster_id,
        teamName,
        ownerName,
        totalSalary: totalWithDeadCap,
        baseSalary: totalSalary,
        deadCap: teamDeadCap,
        capPct,
        faabAvailable: faab.available,
        faabSpent: faab.spent,
        faabTotal: faab.total,
        contractsCount: activeContracts.length,
        expiringCount: expiringPlayerIds.length,
        expiringPlayerIds,
        playerIds,
      };
    });
  }, [rosters, userMap, contracts, deadCapPlayers, getSalaryCapContribution, teamFAAB, salaryCap, faabCap]);

  // League-level rollups
  const leagueRollup = useMemo(() => {
    const teamCount = teamRows.length || 1;
    const totalCommitted = teamRows.reduce((s, t) => s + t.totalSalary, 0);
    const totalCapAvailable = salaryCap * teamCount;
    const totalFaabSpent = teamRows.reduce((s, t) => s + t.faabSpent, 0);
    const totalFaabPool = teamRows.reduce((s, t) => s + t.faabTotal, 0);
    const totalDeadCap = teamRows.reduce((s, t) => s + t.deadCap, 0);
    const totalExpiring = teamRows.reduce((s, t) => s + t.expiringCount, 0);
    return {
      totalCommitted,
      totalCapAvailable,
      totalFaabSpent,
      totalFaabPool,
      totalDeadCap,
      totalExpiring,
    };
  }, [teamRows, salaryCap]);

  const [sortKey, setSortKey] = useState<SortKey>('capPct');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const sortedRows = useMemo(() => {
    const sorted = [...teamRows].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      switch (sortKey) {
        case 'team':
          return a.teamName.localeCompare(b.teamName) * dir;
        case 'salary':
          return (a.totalSalary - b.totalSalary) * dir;
        case 'capPct':
          return (a.capPct - b.capPct) * dir;
        case 'faabAvail':
          return (a.faabAvailable - b.faabAvailable) * dir;
        case 'contracts':
          return (a.contractsCount - b.contractsCount) * dir;
        case 'expiring':
          return (a.expiringCount - b.expiringCount) * dir;
        case 'deadCap':
          return (a.deadCap - b.deadCap) * dir;
      }
    });
    return sorted;
  }, [teamRows, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  // The per-team "Players Needing Decisions" accordion + RETAIN/FRANCHISE
  // override dialog used to live here. Both have moved to the dedicated
  // Walk Year tab so this Overview view stays scannable; the per-team table
  // below still surfaces an EXPIRING column with the count.

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* League-level summary strip */}
      <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <TurfPanel kicker="LEAGUE / SALARY" title="Cap Health">
          <div className="space-y-3">
            <StatLine
              label="COMMITTED"
              value={formatCurrency(leagueRollup.totalCommitted)}
              sub={`of ${formatCurrency(leagueRollup.totalCapAvailable)} pool`}
            />
            <CapBar used={leagueRollup.totalCommitted} total={leagueRollup.totalCapAvailable} />
            <div
              className="font-mono text-muted-foreground"
              style={{ fontSize: 10, letterSpacing: '0.15em' }}
            >
              CAP / TEAM · {formatCurrency(salaryCap)}
            </div>
          </div>
        </TurfPanel>

        <TurfPanel kicker="LEAGUE / FAAB" title="Bid Pool">
          <div className="space-y-3">
            <StatLine
              label="SPENT"
              value={`$${leagueRollup.totalFaabSpent}`}
              sub={`of $${leagueRollup.totalFaabPool} pool`}
            />
            <CapBar used={leagueRollup.totalFaabSpent} total={leagueRollup.totalFaabPool} />
            <div
              className="font-mono text-muted-foreground"
              style={{ fontSize: 10, letterSpacing: '0.15em' }}
            >
              FAAB / TEAM · ${faabCap}
            </div>
          </div>
        </TurfPanel>

        <TurfPanel kicker="CONTRACTS / EXPIRING" title="Walk Year">
          <StatLine
            label="PLAYERS"
            value={String(leagueRollup.totalExpiring)}
            sub="ending this season"
          />
          {leagueRollup.totalExpiring > 0 && (
            <Badge variant="outline" className="mt-3">
              Needs commissioner review
            </Badge>
          )}
        </TurfPanel>

        <TurfPanel kicker="DEAD CAP / TOTAL" title="League Drag">
          <StatLine
            label="THIS YEAR"
            value={formatCurrency(leagueRollup.totalDeadCap)}
            sub="across all rosters"
          />
        </TurfPanel>
      </div>

      {/* Per-team table */}
      <TurfPanel kicker="ROSTERS / FINANCIAL" title="Per-Team Snapshot" big>
        <div className="overflow-x-auto -mx-5 -mb-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                {([
                  ['team', 'TEAM'],
                  ['salary', 'SALARY'],
                  ['capPct', 'CAP %'],
                  ['faabAvail', 'FAAB AVAIL'],
                  ['contracts', 'CONTRACTS'],
                  ['expiring', 'EXPIRING'],
                  ['deadCap', 'DEAD CAP'],
                ] as Array<[SortKey, string]>).map(([key, label]) => (
                  <th
                    key={key}
                    className="px-5 py-3 border-b border-border font-mono font-semibold text-muted-foreground cursor-pointer hover:text-foreground"
                    style={{ fontSize: 10, letterSpacing: '0.18em' }}
                    onClick={() => toggleSort(key)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {label}
                      {sortKey === key && (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row, idx) => (
                <tr
                  key={row.roster_id}
                  className="border-b border-border/40 transition-colors"
                  style={
                    idx % 2 === 1
                      ? { background: 'hsl(var(--card-light) / 0.4)' }
                      : undefined
                  }
                >
                  <td className="px-5 py-3">
                    <div className="font-headline font-bold uppercase text-foreground" style={{ fontSize: 13, letterSpacing: '0.05em' }}>
                      {row.teamName}
                    </div>
                    <div className="font-mono text-muted-foreground mt-0.5" style={{ fontSize: 10, letterSpacing: '0.1em' }}>
                      {row.ownerName}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="font-mono text-foreground" style={{ fontSize: 13 }}>
                      {formatCurrency(row.totalSalary)}
                    </div>
                    {row.deadCap > 0 && (
                      <div className="font-mono text-muted-foreground" style={{ fontSize: 10 }}>
                        incl. {formatCurrency(row.deadCap)} dead
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3 min-w-[140px]">
                    <div className="font-mono text-foreground" style={{ fontSize: 13 }}>
                      {row.capPct.toFixed(0)}%
                    </div>
                    <div className="mt-1.5 w-full">
                      <CapBar used={row.totalSalary} total={salaryCap} />
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="font-mono text-foreground" style={{ fontSize: 13 }}>
                      ${row.faabAvailable}
                    </div>
                    <div className="font-mono text-muted-foreground" style={{ fontSize: 10 }}>
                      ${row.faabSpent} spent / ${row.faabTotal} pool
                    </div>
                  </td>
                  <td className="px-5 py-3 font-mono text-foreground" style={{ fontSize: 13 }}>
                    {row.contractsCount}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={cn(
                        'font-mono inline-flex items-center px-2 py-0.5',
                        row.expiringCount > 0
                          ? 'text-secondary bg-secondary/10 border border-secondary/30'
                          : 'text-muted-foreground',
                      )}
                      style={{ fontSize: 11 }}
                    >
                      {row.expiringCount}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono text-foreground" style={{ fontSize: 13 }}>
                    {row.deadCap > 0 ? formatCurrency(row.deadCap) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TurfPanel>

      {/* What the scheduled job did while nobody was watching. Sits above the
          commissioner audit log because it is the half nobody witnessed. */}
      <TurfPanel kicker="AUTOPILOT / RECENT" title="Automated Changes">
        <AutopilotActivityFeed leagueId={leagueId} />
      </TurfPanel>

      {/* Recent commissioner actions (audit trail) */}
      <TurfPanel kicker="AUDIT / RECENT" title="Commissioner Actions">
        <CommissionerAuditLog leagueId={leagueId} />
      </TurfPanel>
    </div>
  );
};

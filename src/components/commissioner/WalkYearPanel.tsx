import { useMemo, useState } from 'react';
import { TurfPanel } from '@/components/ui/turf-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Crown, RefreshCw, AlertTriangle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useReadOnly } from '@/contexts/read-only-context';
import { usePlayerSalaries } from '@/hooks/usePlayerSalaries';
import { usePlayerContracts } from '@/hooks/usePlayerContracts';
import {
  ManualContractOverrideDialog,
  type OverrideKind,
  type OverrideTarget,
} from './ManualContractOverrideDialog';
import { getTeamName, normalizeUsersToMap } from '@/utils/leagueDataUtils';
import { formatCurrency } from '@/utils/csvExport';
import type { CommissionerLeagueData } from '@/types/sleeper';

interface WalkYearPanelProps {
  leagueId: string;
  leagueData: CommissionerLeagueData;
}

type ExpiringPlayer = {
  playerId: string;
  playerName: string;
  position: string;
  salary: number;
  contractLength: number;
};

type ExpiringTeamGroup = {
  rosterId: number;
  teamName: string;
  ownerName: string;
  players: ExpiringPlayer[];
  totalExpiringSalary: number;
};

const formatPlayerName = (player: any, fallback: string) => {
  if (!player) return fallback;
  const fullName = player?.full_name;
  if (typeof fullName === 'string' && fullName.trim()) return fullName.trim();
  const joined = `${player?.first_name || ''} ${player?.last_name || ''}`.trim();
  return joined || fallback;
};

/**
 * Walk-year panel — players whose `contract_length` is 1 (i.e. ending this
 * season). Grouped per team in an accordion, sorted by urgency (most
 * expiring count, then largest cap-freeing-up). Inline RETAIN / FRANCHISE
 * actions open the existing override dialog.
 *
 * Lives under its own commissioner tab so this triage view doesn't bury
 * itself at the bottom of the long Overview page.
 */
export const WalkYearPanel = ({ leagueId, leagueData }: WalkYearPanelProps) => {
  const { readOnly } = useReadOnly();

  const rosters = useMemo(() => leagueData?.rosters || [], [leagueData?.rosters]);
  const players = useMemo(
    () => leagueData?.players || ({} as Record<string, any>),
    [leagueData?.players],
  );
  const userMap = useMemo(
    () => normalizeUsersToMap(leagueData?.users),
    [leagueData?.users],
  );

  const { salaries, loading: salariesLoading } = usePlayerSalaries(leagueId);
  const { contracts, loading: contractsLoading } = usePlayerContracts(leagueId);

  const loading = salariesLoading || contractsLoading;

  const expiringByTeam = useMemo<ExpiringTeamGroup[]>(() => {
    const groups: ExpiringTeamGroup[] = [];

    rosters.forEach((roster: any) => {
      const owner = userMap[roster.owner_id];
      const teamName = getTeamName(owner);
      const ownerName = owner?.display_name || owner?.username || '—';
      const playerIds: string[] = [
        ...(roster.players || []),
        ...(roster.taxi || []),
      ];
      const expiring = playerIds.filter((pid) => contracts[pid] === 1);
      if (expiring.length === 0) return;

      const teamPlayers: ExpiringPlayer[] = expiring
        .map((pid) => {
          const player = players[pid];
          return {
            playerId: pid,
            playerName: formatPlayerName(player, pid),
            position: player?.position || '—',
            salary: salaries[pid] || 0,
            contractLength: contracts[pid] || 0,
          };
        })
        .sort((a, b) => b.salary - a.salary);

      const totalExpiringSalary = teamPlayers.reduce((s, p) => s + p.salary, 0);

      groups.push({
        rosterId: roster.roster_id,
        teamName,
        ownerName,
        players: teamPlayers,
        totalExpiringSalary,
      });
    });

    return groups.sort((a, b) => {
      const byCount = b.players.length - a.players.length;
      if (byCount !== 0) return byCount;
      return b.totalExpiringSalary - a.totalExpiringSalary;
    });
  }, [rosters, players, salaries, contracts, userMap]);

  const totalExpiringPlayers = useMemo(
    () => expiringByTeam.reduce((s, g) => s + g.players.length, 0),
    [expiringByTeam],
  );

  const expiringDefaultOpen = useMemo(
    () => expiringByTeam.map((g) => `team-${g.rosterId}`),
    [expiringByTeam],
  );

  const [override, setOverride] = useState<{ target: OverrideTarget; kind: OverrideKind } | null>(
    null,
  );
  const openOverride = (target: OverrideTarget, kind: OverrideKind) =>
    setOverride({ target, kind });
  const closeOverride = () => setOverride(null);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <TurfPanel
        kicker={`EXPIRING / WALK YEAR · ${totalExpiringPlayers}`}
        title="Players Needing Decisions"
      >
        {expiringByTeam.length === 0 ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No contracts marked as expiring this season. If this looks wrong, contracts may not be set
              up yet — see the Manager Tools tab.
            </AlertDescription>
          </Alert>
        ) : (
          <Accordion
            type="multiple"
            defaultValue={expiringDefaultOpen}
            className="w-full"
          >
            {expiringByTeam.map((group) => (
              <AccordionItem
                key={group.rosterId}
                value={`team-${group.rosterId}`}
                className="border-b border-border/40"
              >
                <AccordionTrigger className="px-3 py-3 hover:no-underline hover:bg-card-light/30">
                  <div className="flex flex-1 items-center justify-between gap-3 pr-3">
                    <div className="min-w-0 text-left">
                      <div
                        className="font-headline font-bold uppercase text-foreground truncate"
                        style={{ fontSize: 13, letterSpacing: '0.05em' }}
                      >
                        {group.teamName}
                      </div>
                      <div
                        className="font-mono text-muted-foreground mt-0.5"
                        style={{ fontSize: 10, letterSpacing: '0.1em' }}
                      >
                        {group.ownerName.toUpperCase()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge
                        variant="outline"
                        className="font-mono text-secondary border-secondary/40 bg-secondary/10"
                        style={{ fontSize: 10, letterSpacing: '0.1em' }}
                      >
                        {group.players.length} EXPIRING
                      </Badge>
                      <span
                        className="font-mono text-muted-foreground hidden sm:inline"
                        style={{ fontSize: 10, letterSpacing: '0.1em' }}
                      >
                        {formatCurrency(group.totalExpiringSalary)} FREES UP
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-3">
                  <div className="space-y-1">
                    {group.players.map((p) => (
                      <div
                        key={`${group.rosterId}-${p.playerId}`}
                        className="grid grid-cols-[1fr_auto] items-center gap-3 px-3 py-2.5 border-l-2 border-secondary/40 transition-colors"
                        style={{ background: 'hsl(var(--card-light) / 0.4)' }}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className="font-headline font-bold text-foreground truncate"
                              style={{ fontSize: 13 }}
                            >
                              {p.playerName}
                            </span>
                            <Badge
                              variant="outline"
                              className="font-mono"
                              style={{ fontSize: 9, letterSpacing: '0.1em' }}
                            >
                              {p.position}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className="font-mono text-muted-foreground"
                              style={{ fontSize: 10, letterSpacing: '0.1em' }}
                            >
                              {formatCurrency(p.salary)} · {p.contractLength}YR LEFT
                            </span>
                          </div>
                        </div>
                        {!readOnly && (
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 font-mono"
                              style={{ fontSize: 10, letterSpacing: '0.1em' }}
                              onClick={() =>
                                openOverride(
                                  {
                                    playerId: p.playerId,
                                    playerName: p.playerName,
                                    rosterId: group.rosterId,
                                    teamName: group.teamName,
                                    currentSalary: p.salary,
                                    currentContractLength: p.contractLength,
                                  },
                                  'retain',
                                )
                              }
                            >
                              <RefreshCw className="w-3 h-3" />
                              RETAIN
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 font-mono"
                              style={{ fontSize: 10, letterSpacing: '0.1em' }}
                              onClick={() =>
                                openOverride(
                                  {
                                    playerId: p.playerId,
                                    playerName: p.playerName,
                                    rosterId: group.rosterId,
                                    teamName: group.teamName,
                                    currentSalary: p.salary,
                                    currentContractLength: p.contractLength,
                                  },
                                  'franchise',
                                )
                              }
                            >
                              <Crown className="w-3 h-3" />
                              FRANCHISE
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </TurfPanel>

      {override && (
        <ManualContractOverrideDialog
          leagueId={leagueId}
          target={override.target}
          kind={override.kind}
          onClose={closeOverride}
        />
      )}
    </div>
  );
};

import { useMemo } from 'react';
import { TurfPanel } from '@/components/ui/turf-panel';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Info } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useReadOnly } from '@/contexts/read-only-context';
import { usePlayerSalaries } from '@/hooks/usePlayerSalaries';
import {
  usePlayerAcquisitions,
  type AcquisitionSource,
} from '@/hooks/usePlayerAcquisitions';
import EditableSalary from '@/components/EditableSalary';
import { getTeamName, normalizeUsersToMap } from '@/utils/leagueDataUtils';
import type { CommissionerLeagueData } from '@/types/sleeper';

interface PlayerPricingPanelProps {
  leagueId: string;
  leagueData: CommissionerLeagueData;
}

interface UnpricedPlayer {
  playerId: string;
  playerName: string;
  position: string;
  nflTeam: string;
  rosterId: number;
  source: AcquisitionSource;
}

interface SourceGroup {
  source: AcquisitionSource;
  label: string;
  blurb: string;
  players: UnpricedPlayer[];
}

const formatPlayerName = (player: any, fallback: string) => {
  if (!player) return fallback;
  const fullName = player?.full_name;
  if (typeof fullName === 'string' && fullName.trim()) return fullName.trim();
  const joined = `${player?.first_name || ''} ${player?.last_name || ''}`.trim();
  return joined || fallback;
};

// Order = priority. Drafted players are most likely to need pricing
// (Sleeper doesn't expose a "draft cost"); waivers come last because
// the FAAB-bid auto-applier already prices them.
const SOURCE_PRIORITY: AcquisitionSource[] = [
  'draft',
  'trade',
  'free_agent',
  'commissioner',
  'waiver',
  'unknown',
];

const SOURCE_META: Record<AcquisitionSource, { label: string; blurb: string }> = {
  draft: {
    label: 'Drafted',
    blurb:
      'Drafted players come without a cost from Sleeper. Set their salary so cap math works.',
  },
  trade: {
    label: 'Acquired via trade',
    blurb:
      'Trade-acquired players keep their existing salary if one was set on the prior roster — flag any that ended up unpriced.',
  },
  free_agent: {
    label: 'Free agent',
    blurb:
      'Open free agents (waiver-style add with $0 bid). Set a price if your league treats them as paid additions.',
  },
  commissioner: {
    label: 'Commissioner add',
    blurb: 'Players added directly via commissioner action — no auto-priced cost.',
  },
  waiver: {
    label: 'Waiver pickup',
    blurb:
      'Waivers normally auto-price to the FAAB bid. Anything unpriced here is a bid-of-zero pickup or one that slipped past the auto-processor.',
  },
  unknown: {
    label: 'Unknown source',
    blurb: 'Players whose origin transaction is not in the loaded log.',
  },
};

/**
 * Surfaces every currently-rostered player who is missing a salary
 * (null or 0) and groups them by acquisition source so the commissioner
 * can triage the most-likely missing pricing first.
 *
 * Waiver-pickup salaries are auto-applied from the FAAB bid by
 * useTransactionProcessor, so most waivers already have a salary set.
 * Drafted, traded, and free-agent players are the typical "needs cost"
 * candidates this panel surfaces.
 */
export const PlayerPricingPanel = ({
  leagueId,
  leagueData,
}: PlayerPricingPanelProps) => {
  const { readOnly } = useReadOnly();

  const rosters = useMemo(() => leagueData?.rosters || [], [leagueData?.rosters]);
  const players = useMemo(
    () => leagueData?.players || ({} as Record<string, any>),
    [leagueData?.players],
  );
  const transactions = useMemo(
    () => leagueData?.transactions || [],
    [leagueData?.transactions],
  );
  const draftPicks = useMemo(
    () => leagueData?.draftPicks || [],
    [leagueData?.draftPicks],
  );
  const userMap = useMemo(
    () => normalizeUsersToMap(leagueData?.users),
    [leagueData?.users],
  );

  const { salaries, updateSalary, loading: salariesLoading } =
    usePlayerSalaries(leagueId);
  const { byPlayer } = usePlayerAcquisitions({ rosters, transactions, draftPicks });

  const teamNameByRoster = useMemo(() => {
    const map = new Map<number, string>();
    rosters.forEach((roster: any) => {
      map.set(roster.roster_id, getTeamName(userMap[roster.owner_id]));
    });
    return map;
  }, [rosters, userMap]);

  // Build the list of unpriced players, with their acquisition source.
  const unpriced = useMemo<UnpricedPlayer[]>(() => {
    const out: UnpricedPlayer[] = [];

    rosters.forEach((roster: any) => {
      const playerIds: string[] = Array.from(
        new Set([
          ...(roster.players || []),
          ...(roster.reserve || []),
          ...(roster.taxi || []),
        ]),
      );

      playerIds.forEach((pid) => {
        if (!pid || pid === '0') return;
        const salary = salaries[pid];
        // Treat null and 0 alike — both mean "no usable cost set".
        if (salary != null && salary > 0) return;

        const player = players[pid];
        const acquisition = byPlayer.get(pid);
        out.push({
          playerId: pid,
          playerName: formatPlayerName(player, pid),
          position: player?.position || '—',
          nflTeam: player?.team || 'FA',
          rosterId: roster.roster_id,
          source: acquisition?.source ?? 'unknown',
        });
      });
    });

    return out;
  }, [rosters, players, salaries, byPlayer]);

  const grouped = useMemo<SourceGroup[]>(() => {
    const bySource = new Map<AcquisitionSource, UnpricedPlayer[]>();
    unpriced.forEach((p) => {
      const list = bySource.get(p.source) || [];
      list.push(p);
      bySource.set(p.source, list);
    });

    return SOURCE_PRIORITY.flatMap((source) => {
      const list = bySource.get(source);
      if (!list || list.length === 0) return [];
      const meta = SOURCE_META[source];
      // Within each source bucket, sort by team-name for stable scanning.
      const sorted = [...list].sort((a, b) => {
        const teamCmp = (teamNameByRoster.get(a.rosterId) || '').localeCompare(
          teamNameByRoster.get(b.rosterId) || '',
        );
        if (teamCmp !== 0) return teamCmp;
        return a.playerName.localeCompare(b.playerName);
      });
      return [
        {
          source,
          label: meta.label,
          blurb: meta.blurb,
          players: sorted,
        },
      ];
    });
  }, [unpriced, teamNameByRoster]);

  const defaultOpen = useMemo(() => grouped.map((g) => `source-${g.source}`), [
    grouped,
  ]);

  const handleSalaryUpdate = async (
    playerId: string,
    salary: number | null,
  ): Promise<boolean> => updateSalary(playerId, salary);

  if (salariesLoading) {
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
        kicker={`PRICING / NEEDS COST · ${unpriced.length}`}
        title="Players Without a Salary"
      >
        {readOnly && (
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Read-only view. Sign in as the league owner to set salaries inline here.
            </AlertDescription>
          </Alert>
        )}

        {unpriced.length === 0 ? (
          <Alert className="border-emerald-500/30 bg-emerald-500/5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <AlertDescription>
              Every rostered player has a salary set. Nothing to triage right now.
            </AlertDescription>
          </Alert>
        ) : (
          <Accordion
            type="multiple"
            defaultValue={defaultOpen}
            className="w-full"
          >
            {grouped.map((group) => (
              <AccordionItem
                key={group.source}
                value={`source-${group.source}`}
                className="border-b border-border/40"
              >
                <AccordionTrigger className="px-3 py-3 hover:no-underline hover:bg-card-light/30">
                  <div className="flex flex-1 items-center justify-between gap-3 pr-3">
                    <div className="min-w-0 text-left">
                      <div
                        className="font-headline font-bold uppercase text-foreground"
                        style={{ fontSize: 13, letterSpacing: '0.05em' }}
                      >
                        {group.label}
                      </div>
                      <div
                        className="font-mono text-muted-foreground mt-0.5 text-left"
                        style={{ fontSize: 10, letterSpacing: '0.05em' }}
                      >
                        {group.blurb}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="font-mono text-secondary border-secondary/40 bg-secondary/10 flex-shrink-0"
                      style={{ fontSize: 10, letterSpacing: '0.1em' }}
                    >
                      {group.players.length} {group.players.length === 1 ? 'PLAYER' : 'PLAYERS'}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-3">
                  <div className="space-y-1">
                    {group.players.map((p) => (
                      <div
                        key={`${p.rosterId}-${p.playerId}`}
                        className="grid grid-cols-[1fr_auto] items-center gap-3 px-3 py-2.5 border-l-2 border-secondary/40 transition-colors"
                        style={{ background: 'hsl(var(--card-light) / 0.4)' }}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
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
                            <span
                              className="font-mono text-muted-foreground"
                              style={{ fontSize: 10, letterSpacing: '0.1em' }}
                            >
                              {p.nflTeam}
                            </span>
                          </div>
                          <div
                            className="font-mono text-muted-foreground mt-0.5"
                            style={{ fontSize: 10, letterSpacing: '0.1em' }}
                          >
                            {(teamNameByRoster.get(p.rosterId) || 'Unknown Team').toUpperCase()}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <EditableSalary
                            playerId={p.playerId}
                            currentSalary={salaries[p.playerId] ?? null}
                            onSalaryUpdate={handleSalaryUpdate}
                            leagueId={leagueId}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </TurfPanel>
    </div>
  );
};

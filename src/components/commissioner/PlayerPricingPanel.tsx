import { useEffect, useMemo, useRef, useState } from 'react';
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
import { usePlayerContracts } from '@/hooks/usePlayerContracts';
import {
  usePlayerAcquisitions,
  type AcquisitionSource,
} from '@/hooks/usePlayerAcquisitions';
import EditableSalary from '@/components/EditableSalary';
import EditableContractLength from '@/components/EditableContractLength';
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
  const { contracts, updateContract, loading: contractsLoading } =
    usePlayerContracts(leagueId);
  const { byPlayer } = usePlayerAcquisitions({ rosters, transactions, draftPicks });

  const teamNameByRoster = useMemo(() => {
    const map = new Map<number, string>();
    rosters.forEach((roster: any) => {
      map.set(roster.roster_id, getTeamName(userMap[roster.owner_id]));
    });
    return map;
  }, [rosters, userMap]);

  // Set of players currently rostered AND missing a salary right this render.
  // The visible list is derived from the SESSION-STICKY set below, not this —
  // see comment there for why.
  const currentlyUnpricedIds = useMemo<Set<string>>(() => {
    const ids = new Set<string>();
    rosters.forEach((roster: any) => {
      const playerIds: string[] = [
        ...(roster.players || []),
        ...(roster.reserve || []),
        ...(roster.taxi || []),
      ];
      playerIds.forEach((pid) => {
        if (!pid || pid === '0') return;
        const salary = salaries[pid];
        if (salary == null || salary === 0) ids.add(pid);
      });
    });
    return ids;
  }, [rosters, salaries]);

  // Set of all currently rostered player_ids (any roster). Used to garbage-
  // collect the sticky set when a player is traded or dropped mid-session.
  const allRosteredIds = useMemo<Set<string>>(() => {
    const ids = new Set<string>();
    rosters.forEach((roster: any) => {
      [
        ...(roster.players || []),
        ...(roster.reserve || []),
        ...(roster.taxi || []),
      ].forEach((pid: string) => {
        if (pid && pid !== '0') ids.add(pid);
      });
    });
    return ids;
  }, [rosters]);

  // SESSION-STICKY visibility:
  //
  //   The contract-length control sits next to the salary control on every
  //   row. If the visible list were filtered by "salary == null || 0" on
  //   every render, then the moment the commissioner saves the salary the
  //   row unmounts — taking the contract-length control with it before
  //   the user can submit a length. The "set both inline" workflow breaks
  //   for exactly the case it was added for (drafted players).
  //
  //   Fix: snapshot every player who shows up as unpriced during the panel's
  //   lifetime into a sticky set. Keep them rendered until either (a) the
  //   panel unmounts (page navigation away) or (b) they leave the league
  //   (traded/dropped). Setting a salary still updates the underlying
  //   data — we just don't drop the row from sight while the user is
  //   working on it.
  const stickyIdsRef = useRef<Set<string>>(new Set());
  const [stickyTick, setStickyTick] = useState(0);

  useEffect(() => {
    const sticky = stickyIdsRef.current;
    let changed = false;

    // Add any newly-seen unpriced players
    currentlyUnpricedIds.forEach((pid) => {
      if (!sticky.has(pid)) {
        sticky.add(pid);
        changed = true;
      }
    });

    // Drop players who are no longer rostered at all (traded/dropped during
    // the session). Their pricing isn't this commissioner's problem anymore.
    sticky.forEach((pid) => {
      if (!allRosteredIds.has(pid)) {
        sticky.delete(pid);
        changed = true;
      }
    });

    if (changed) setStickyTick((t) => t + 1);
  }, [currentlyUnpricedIds, allRosteredIds]);

  // Build the visible list off the sticky set. Each row reads its CURRENT
  // salary from the salaries map — a freshly-priced player keeps its row
  // but its salary input now displays the saved value, which gives the
  // commissioner a visual confirmation that the row is "done".
  const unpriced = useMemo<UnpricedPlayer[]>(() => {
    const out: UnpricedPlayer[] = [];
    const sticky = stickyIdsRef.current;

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
        if (!sticky.has(pid)) return;

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
    // stickyTick is intentional — it forces a recompute when the sticky set
    // is mutated via the ref above (refs alone don't trigger re-renders).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rosters, players, byPlayer, stickyTick]);

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

  // updateContract returns boolean; pass through directly. The
  // EditableContractLength component refuses the edit on FAAB-acquired
  // players (read-only display) so we don't need a parallel guard here.
  const handleContractUpdate = async (
    playerId: string,
    contractLength: number | null,
  ): Promise<boolean> => updateContract(playerId, contractLength);

  if (salariesLoading || contractsLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  // Counts: `unpriced.length` is the visible row count (sticky — includes
  // already-priced rows the commissioner is mid-edit on). `stillUnpricedCount`
  // is the work that remains. Show "X of Y" in the kicker when they differ
  // so the commissioner can see progress without losing context on which
  // players they've already touched.
  const stillUnpricedCount = currentlyUnpricedIds.size;
  const kickerCount =
    stillUnpricedCount === unpriced.length
      ? String(unpriced.length)
      : `${stillUnpricedCount} of ${unpriced.length}`;

  return (
    <div className="space-y-5">
      <TurfPanel
        kicker={`PRICING / NEEDS COST · ${kickerCount}`}
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
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <EditableSalary
                            playerId={p.playerId}
                            currentSalary={salaries[p.playerId] ?? null}
                            onSalaryUpdate={handleSalaryUpdate}
                            leagueId={leagueId}
                          />
                          {/* Contract length lives next to the salary so a
                              drafted player can have BOTH set in a single
                              pass. EditableContractLength gates FAAB
                              acquisitions to read-only on its own. */}
                          <EditableContractLength
                            playerId={p.playerId}
                            currentLength={contracts[p.playerId] ?? null}
                            onContractUpdate={handleContractUpdate}
                            leagueId={leagueId}
                            rosterId={p.rosterId}
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

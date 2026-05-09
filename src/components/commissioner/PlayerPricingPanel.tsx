import { useEffect, useMemo, useState } from 'react';
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
import { useCommissionerActions } from '@/hooks/useCommissionerActions';
import EditableSalary from '@/components/EditableSalary';
import EditableContractLength from '@/components/EditableContractLength';
import { getTeamName, normalizeUsersToMap } from '@/utils/leagueDataUtils';
import { formatCurrency } from '@/utils/csvExport';
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
  /** Players in this group whose salary is still null/0 (i.e. need work). */
  stillUnpricedCount: number;
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
      'Waivers normally auto-price to the FAAB bid. Anything unpriced here is a bid-of-zero pickup or one that slipped past the auto-processor — set the salary inline. Contract lengths do not apply (FAAB pickups have no contract in this setup).',
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
  const { logAction } = useCommissionerActions(leagueId);

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
  //   Fix: visibleIds = persistedSticky ∪ currentlyUnpriced (computed each
  //   render so newly-priced rows stay visible AND the first render shows
  //   the right rows without flicker). The effect below persists the union
  //   forward and prunes anyone who's no longer rostered, so the set
  //   doesn't grow unbounded and dropped/traded players fall off cleanly.
  const [persistedSticky, setPersistedSticky] = useState<Set<string>>(
    () => new Set(),
  );

  const visibleIds = useMemo<Set<string>>(() => {
    const merged = new Set(persistedSticky);
    currentlyUnpricedIds.forEach((pid) => merged.add(pid));
    return merged;
  }, [persistedSticky, currentlyUnpricedIds]);

  useEffect(() => {
    setPersistedSticky((prev) => {
      const next = new Set<string>();
      visibleIds.forEach((pid) => {
        if (allRosteredIds.has(pid)) next.add(pid);
      });
      // Avoid a state update when the set hasn't actually changed (state
      // identity matters for the visibleIds memo dep).
      if (next.size === prev.size) {
        let same = true;
        for (const pid of next) {
          if (!prev.has(pid)) {
            same = false;
            break;
          }
        }
        if (same) return prev;
      }
      return next;
    });
  }, [visibleIds, allRosteredIds]);

  // Build the visible list off the union set. Each row reads its CURRENT
  // salary from the salaries map — a freshly-priced player keeps its row
  // but its salary input now displays the saved value, which gives the
  // commissioner a visual confirmation that the row is "done".
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
        if (!visibleIds.has(pid)) return;

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
  }, [rosters, players, byPlayer, visibleIds]);

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
      const stillUnpricedCount = sorted.reduce(
        (count, p) => count + (currentlyUnpricedIds.has(p.playerId) ? 1 : 0),
        0,
      );
      return [
        {
          source,
          label: meta.label,
          blurb: meta.blurb,
          players: sorted,
          stillUnpricedCount,
        },
      ];
    });
  }, [unpriced, teamNameByRoster, currentlyUnpricedIds]);

  const defaultOpen = useMemo(() => grouped.map((g) => `source-${g.source}`), [
    grouped,
  ]);

  // Look up the player's display info for audit-log descriptions. Falls
  // back to the players map if the row was already pruned from `unpriced`
  // by the time the audit fires (shouldn't happen, but be defensive).
  const getRowInfo = (playerId: string) => {
    const row = unpriced.find((p) => p.playerId === playerId);
    if (row) return row;
    const player = players[playerId];
    return {
      playerId,
      playerName: formatPlayerName(player, playerId),
      position: player?.position || '—',
      nflTeam: player?.team || 'FA',
      rosterId: -1,
      source: byPlayer.get(playerId)?.source ?? ('unknown' as AcquisitionSource),
    };
  };

  // Both inline edits write to the commissioner_actions audit table on
  // success so this surface is consistent with the RETAIN/FRANCHISE
  // override flow on the Walk Year tab. The audit fires async (`void`)
  // so a slow network doesn't block the UI; failures only log silently.
  const handleSalaryUpdate = async (
    playerId: string,
    salary: number | null,
  ): Promise<boolean> => {
    const previous = salaries[playerId] ?? null;
    const success = await updateSalary(playerId, salary);
    if (success) {
      const info = getRowInfo(playerId);
      const teamName =
        info.rosterId >= 0 ? teamNameByRoster.get(info.rosterId) : undefined;
      void logAction({
        action_type: 'salary_set_inline',
        target_type: 'player_salary',
        target_id: playerId,
        description: `Set salary on ${info.playerName} to ${formatCurrency(salary || 0)}`,
        metadata: {
          roster_id: info.rosterId,
          team_name: teamName,
          source: info.source,
          previous_salary: previous,
          new_salary: salary,
          surface: 'pricing-panel',
        },
      });
    }
    return success;
  };

  const handleContractUpdate = async (
    playerId: string,
    contractLength: number | null,
  ): Promise<boolean> => {
    const previous = contracts[playerId] ?? null;
    const success = await updateContract(playerId, contractLength);
    if (success) {
      const info = getRowInfo(playerId);
      const teamName =
        info.rosterId >= 0 ? teamNameByRoster.get(info.rosterId) : undefined;
      void logAction({
        action_type: 'contract_set_inline',
        target_type: 'player_contract',
        target_id: playerId,
        description: `Set contract on ${info.playerName} to ${contractLength == null ? 'no contract' : `${contractLength}yr`}`,
        metadata: {
          roster_id: info.rosterId,
          team_name: teamName,
          source: info.source,
          previous_contract_length: previous,
          new_contract_length: contractLength,
          surface: 'pricing-panel',
        },
      });
    }
    return success;
  };

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
                      {group.stillUnpricedCount === group.players.length
                        ? `${group.players.length} ${group.players.length === 1 ? 'PLAYER' : 'PLAYERS'}`
                        : `${group.stillUnpricedCount} OF ${group.players.length} LEFT`}
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
                          {/* Waiver pickups don't get contract lengths
                              (the league policy enforced server-side by
                              usePlayerContracts.updateContract — it
                              refuses on acquisition_type='faab'). Hide
                              the control entirely for waiver source
                              players and explain why, instead of leaving
                              an unexplained-disabled input on the row. */}
                          {p.source === 'waiver' ? (
                            <span
                              className="font-mono text-muted-foreground italic"
                              style={{ fontSize: 10, letterSpacing: '0.05em' }}
                              title="FAAB / waiver pickups do not have contract lengths in this league setup."
                            >
                              FAAB pickup · no contract
                            </span>
                          ) : (
                            <EditableContractLength
                              playerId={p.playerId}
                              currentLength={contracts[p.playerId] ?? null}
                              onContractUpdate={handleContractUpdate}
                              leagueId={leagueId}
                              rosterId={p.rosterId}
                            />
                          )}
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

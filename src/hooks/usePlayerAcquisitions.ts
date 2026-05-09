import { useMemo } from 'react';

export type AcquisitionSource = 'waiver' | 'free_agent' | 'trade' | 'commissioner' | 'draft' | 'unknown';

export interface PlayerAcquisition {
  source: AcquisitionSource;
  /** Roster the player ended up on. */
  rosterId: number;
  /** FAAB bid for waiver / free-agent pickups (0 for trades, drafts, commissioner moves). */
  faabBid: number;
  /** Sleeper week (`leg`) the transaction was processed in, or `null`. */
  week: number | null;
  /** Sleeper transaction id this acquisition came from. `null` for draft picks. */
  transactionId: string | null;
  /** Epoch ms timestamp of the transaction, or `null`. */
  acquiredAt: number | null;
  /** For trades: the roster id the player came from. */
  fromRosterId: number | null;
}

interface UsePlayerAcquisitionsArgs {
  rosters: any[];
  transactions: any[];
  draftPicks?: Array<{ draft?: any; picks?: any[] }>;
}

const acquisitionWeight = (source: AcquisitionSource): number => {
  // Higher = "more recent / more authoritative" when collapsing to a single
  // source per player. Trades supersede drafts, waivers/FAs supersede trades
  // (since they happen later in the lifecycle).
  switch (source) {
    case 'waiver':
      return 5;
    case 'free_agent':
      return 5;
    case 'commissioner':
      return 4;
    case 'trade':
      return 3;
    case 'draft':
      return 1;
    default:
      return 0;
  }
};

const sourceFromTransactionType = (raw: string | undefined): AcquisitionSource => {
  switch (raw) {
    case 'waiver':
      return 'waiver';
    case 'free_agent':
      return 'free_agent';
    case 'trade':
      return 'trade';
    case 'commissioner':
      return 'commissioner';
    default:
      return 'unknown';
  }
};

/**
 * Walks the league transaction log + draft picks and resolves how each
 * currently-rostered player got onto their team. Useful for spotting
 * waiver pickups (which convert to RFAs at season end in many dynasty
 * leagues) versus drafted players, traded-for assets, or open free agents.
 *
 * Returns:
 *   byRoster:  { [rosterId]: PlayerAcquisition[] sorted newest-first }
 *   byPlayer:  { [playerId]: PlayerAcquisition }  // most recent only
 *
 * The `byPlayer` map keys ONLY include players still rostered (i.e. the
 * latest "add" wasn't followed by a later "drop" or trade-away). This
 * keeps consumers honest about what's currently on the team.
 */
export const usePlayerAcquisitions = ({
  rosters,
  transactions,
  draftPicks = [],
}: UsePlayerAcquisitionsArgs) => {
  const byPlayer = useMemo(() => {
    const map = new Map<string, PlayerAcquisition>();

    // Build the set of players still on each roster — anything not in this
    // set was traded/dropped away and shouldn't appear in the result.
    const currentlyRostered = new Set<string>();
    const rosterByPlayer = new Map<string, number>();
    rosters.forEach((roster) => {
      const ids = [
        ...((roster.players as string[]) || []),
        ...((roster.reserve as string[]) || []),
        ...((roster.taxi as string[]) || []),
      ];
      ids.forEach((id) => {
        if (!id || id === '0') return;
        currentlyRostered.add(id);
        rosterByPlayer.set(id, roster.roster_id);
      });
    });

    // Seed with draft picks first — they're the lowest-weight source and
    // get superseded by any later transaction.
    draftPicks.forEach(({ draft, picks }) => {
      (picks || []).forEach((pick: any) => {
        const playerId: string | undefined = pick?.player_id;
        if (!playerId || !currentlyRostered.has(playerId)) return;
        const rosterId = rosterByPlayer.get(playerId);
        if (typeof rosterId !== 'number') return;
        // Only assign draft as the source if the player is still on the
        // team that drafted them (otherwise a later trade is more accurate).
        if (Number(pick.roster_id) !== rosterId) return;
        map.set(playerId, {
          source: 'draft',
          rosterId,
          faabBid: 0,
          week: null,
          transactionId: null,
          acquiredAt: draft?.start_time ? Number(draft.start_time) : null,
          fromRosterId: null,
        });
      });
    });

    // Walk transactions newest-first; first add we see for a still-rostered
    // player wins (and we ignore subsequent older entries).
    const ordered = [...transactions].sort((a, b) => {
      const da = a?.created || a?.status_updated || 0;
      const db = b?.created || b?.status_updated || 0;
      return db - da;
    });

    ordered.forEach((tx) => {
      if (tx?.status !== 'complete') return;
      const adds = tx?.adds as Record<string, number> | undefined;
      if (!adds) return;
      const txSource = sourceFromTransactionType(tx?.type);
      const txWeek =
        typeof tx?.leg === 'number' ? tx.leg : typeof tx?.week === 'number' ? tx.week : null;
      const txTime = (tx?.created || tx?.status_updated || null) as number | null;
      const txId = (tx?.transaction_id as string | undefined) ?? null;
      const faabBid = Number(tx?.settings?.waiver_bid || 0) || 0;

      Object.entries(adds).forEach(([playerId, addedRosterId]) => {
        if (!currentlyRostered.has(playerId)) return;
        const currentRosterId = rosterByPlayer.get(playerId);
        if (typeof currentRosterId !== 'number') return;
        // The player must still be on the roster they were added to —
        // otherwise the latest move was a trade or drop, and we'll capture
        // that move when we visit it.
        if (Number(addedRosterId) !== currentRosterId) return;

        const existing = map.get(playerId);
        if (existing) {
          // Newest-first means we already have the most recent record;
          // keep it unless this one is "stronger" at the same timestamp.
          const existingTime = existing.acquiredAt ?? 0;
          const thisTime = txTime ?? 0;
          if (existingTime > thisTime) return;
          if (
            existingTime === thisTime &&
            acquisitionWeight(existing.source) >= acquisitionWeight(txSource)
          ) {
            return;
          }
        }

        // For trades, infer the previous owner from `roster_ids` — the
        // entry that isn't the new owner is the prior owner.
        let fromRosterId: number | null = null;
        if (txSource === 'trade' && Array.isArray(tx?.roster_ids)) {
          const partner = (tx.roster_ids as number[]).find((rid) => rid !== currentRosterId);
          fromRosterId = typeof partner === 'number' ? partner : null;
        }

        map.set(playerId, {
          source: txSource === 'unknown' ? 'free_agent' : txSource,
          rosterId: currentRosterId,
          faabBid,
          week: txWeek,
          transactionId: txId,
          acquiredAt: txTime,
          fromRosterId,
        });
      });
    });

    return map;
  }, [rosters, transactions, draftPicks]);

  const byRoster = useMemo(() => {
    const grouped = new Map<number, Array<PlayerAcquisition & { playerId: string }>>();
    byPlayer.forEach((info, playerId) => {
      const list = grouped.get(info.rosterId) || [];
      list.push({ ...info, playerId });
      grouped.set(info.rosterId, list);
    });
    grouped.forEach((list) => {
      list.sort((a, b) => (b.acquiredAt || 0) - (a.acquiredAt || 0));
    });
    return grouped;
  }, [byPlayer]);

  return {
    byPlayer,
    byRoster,
    /** Convenience: just the waiver pickups (most-likely RFA candidates at season end). */
    waiverByRoster: useMemo(() => {
      const out = new Map<number, Array<PlayerAcquisition & { playerId: string }>>();
      byRoster.forEach((list, rosterId) => {
        const waivers = list.filter((entry) => entry.source === 'waiver');
        if (waivers.length > 0) out.set(rosterId, waivers);
      });
      return out;
    }, [byRoster]),
  };
};

import { describe, it, expect } from 'vitest';
import { replayRosters, buildCurrentState } from './rosterReplay';
import type { ReplayableRoster, ReplayableTransaction } from './rosterReplay';

const roster = (
  roster_id: number,
  players: string[],
  extra: Partial<ReplayableRoster> = {},
): ReplayableRoster => ({ roster_id, players, ...extra });

const tx = (
  transaction_id: string,
  created: number,
  opts: Partial<ReplayableTransaction> = {},
): ReplayableTransaction => ({
  transaction_id,
  created,
  status: 'complete',
  type: 'free_agent',
  ...opts,
});

/** Roster ids -> sorted player ids, for readable assertions. */
const snapshot = (state: Map<number, Set<string>> | undefined) => {
  if (!state) return null;
  const out: Record<number, string[]> = {};
  state.forEach((players, rosterId) => {
    out[rosterId] = [...players].sort();
  });
  return out;
};

describe('buildCurrentState', () => {
  it('unions players, taxi and reserve into one membership set', () => {
    const state = buildCurrentState([
      roster(1, ['a', 'b', 't'], { taxi: ['t'], reserve: ['b'] }),
    ]);
    expect(snapshot(state)).toEqual({ 1: ['a', 'b', 't'] });
  });

  it('skips rosters with no numeric roster_id', () => {
    expect(buildCurrentState([{ players: ['a'] }] as ReplayableRoster[]).size).toBe(0);
  });
});

describe('replayRosters', () => {
  it('reconstructs the roster state after a simple add', () => {
    // Team 1 currently has a, b. b arrived via a free agent pickup.
    const result = replayRosters(
      [roster(1, ['a', 'b'])],
      [tx('t1', 1000, { adds: { b: 1 } })],
    );

    expect(result.converged).toBe(true);
    expect(snapshot(result.stateAfter.get('t1'))).toEqual({ 1: ['a', 'b'] });
  });

  it('reconstructs an add-with-drop as a single step', () => {
    const result = replayRosters(
      [roster(1, ['a', 'new'])],
      [tx('t1', 1000, { adds: { new: 1 }, drops: { old: 1 } })],
    );

    expect(result.converged).toBe(true);
    // After the transaction: old is gone, new is on.
    expect(snapshot(result.stateAfter.get('t1'))).toEqual({ 1: ['a', 'new'] });
  });

  it('moves a traded player between rosters', () => {
    // p started on roster 2 and is now on roster 1 via a trade.
    const result = replayRosters(
      [roster(1, ['a', 'p']), roster(2, ['b'])],
      [tx('trade1', 1000, { type: 'trade', adds: { p: 1 }, drops: { p: 2 } })],
    );

    expect(result.converged).toBe(true);
    expect(snapshot(result.stateAfter.get('trade1'))).toEqual({ 1: ['a', 'p'], 2: ['b'] });
  });

  it('captures intermediate state across a sequence, not just the end', () => {
    // p is added to roster 1, then traded to roster 2. The state after the
    // FIRST transaction must show him on roster 1 — that is the whole point
    // of the replay, and a naive implementation that only tracks the present
    // would show him on 2 in both snapshots.
    const result = replayRosters(
      [roster(1, ['a']), roster(2, ['b', 'p'])],
      [
        tx('add', 1000, { adds: { p: 1 } }),
        tx('trade', 2000, { type: 'trade', adds: { p: 2 }, drops: { p: 1 } }),
      ],
    );

    expect(result.converged).toBe(true);
    expect(snapshot(result.stateAfter.get('add'))).toEqual({ 1: ['a', 'p'], 2: ['b'] });
    expect(snapshot(result.stateAfter.get('trade'))).toEqual({ 1: ['a'], 2: ['b', 'p'] });
  });

  it('orders by timestamp, not array order', () => {
    const result = replayRosters(
      [roster(1, ['a']), roster(2, ['p'])],
      [
        // Supplied newest-first; the engine must sort.
        tx('trade', 2000, { type: 'trade', adds: { p: 2 }, drops: { p: 1 } }),
        tx('add', 1000, { adds: { p: 1 } }),
      ],
    );

    expect(result.converged).toBe(true);
    expect(result.ordered.map((t) => t.transaction_id)).toEqual(['add', 'trade']);
    expect(snapshot(result.stateAfter.get('add'))).toEqual({ 1: ['a', 'p'], 2: [] });
  });

  it('ignores transactions that did not complete', () => {
    const result = replayRosters(
      [roster(1, ['a'])],
      [tx('failed', 1000, { status: 'failed', adds: { ghost: 1 } })],
    );

    expect(result.converged).toBe(true);
    expect(result.ordered).toHaveLength(0);
    expect(result.stateAfter.has('failed')).toBe(false);
  });

  describe('drift detection', () => {
    it('flags an add for a player who is not on the roster that received him', () => {
      // The log says c was added to roster 1, but c is nowhere — someone
      // moved him outside the transaction log.
      const result = replayRosters(
        [roster(1, ['a', 'b'])],
        [tx('t1', 1000, { adds: { c: 1 } })],
      );

      expect(result.converged).toBe(false);
      expect(result.anomalies[0]).toContain('c');
      expect(result.anomalies[0]).toContain('on no roster');
    });

    it('flags a drop for a player who is still rostered', () => {
      // The log says d was dropped, yet he sits on roster 1 with no later
      // transaction re-adding him.
      const result = replayRosters(
        [roster(1, ['d'])],
        [tx('t1', 1000, { drops: { d: 1 } })],
      );

      expect(result.converged).toBe(false);
      expect(result.anomalies[0]).toContain('d');
    });

    it('does not fire on a coherent log', () => {
      const result = replayRosters(
        [roster(1, ['a', 'b']), roster(2, ['c'])],
        [
          tx('t1', 1000, { adds: { b: 1 }, drops: { z: 1 } }),
          tx('t2', 2000, { type: 'trade', adds: { c: 2 }, drops: { c: 1 } }),
        ],
      );

      expect(result.anomalies).toEqual([]);
      expect(result.converged).toBe(true);
    });

    it('caps how many anomalies it collects', () => {
      const many = Array.from({ length: 50 }, (_, i) =>
        tx(`t${i}`, 1000 + i, { adds: { [`missing${i}`]: 1 } }),
      );
      const result = replayRosters([roster(1, ['a'])], many);

      expect(result.converged).toBe(false);
      expect(result.anomalies.length).toBeLessThanOrEqual(10);
    });
  });

  describe('malformed payloads', () => {
    it('ignores adds that are not player_id -> roster_id', () => {
      // The demo fixture keys by user_id with array values. Reading that as
      // moves would invent roster changes out of nothing.
      const result = replayRosters(
        [roster(1, ['a'])],
        [tx('t1', 1000, { adds: { demo_user_1: ['8547'] } as unknown as Record<string, unknown> })],
      );

      expect(result.converged).toBe(true);
      expect(snapshot(result.stateAfter.get('t1'))).toEqual({ 1: ['a'] });
    });

    it('accepts numeric strings as roster ids', () => {
      const result = replayRosters(
        [roster(1, ['a', 'b'])],
        [tx('t1', 1000, { adds: { b: '1' } })],
      );

      expect(result.converged).toBe(true);
      expect(snapshot(result.stateAfter.get('t1'))).toEqual({ 1: ['a', 'b'] });
    });

    it('survives null adds/drops and empty input', () => {
      expect(replayRosters([], []).converged).toBe(true);
      const result = replayRosters(
        [roster(1, ['a'])],
        [tx('t1', 1000, { adds: null, drops: null })],
      );
      expect(result.converged).toBe(true);
    });
  });
});

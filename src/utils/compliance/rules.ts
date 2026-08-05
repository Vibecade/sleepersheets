/**
 * League rules, one pure function each.
 *
 * Every rule takes the full context and returns findings. None of them write
 * anything or decide anything — Sleeper's API is read-only, so a finding is a
 * claim presented to the commissioner, who acts in Sleeper. That framing is
 * why each finding carries its arithmetic in `detail`: a claim the
 * commissioner can't check is a claim they won't act on.
 *
 * Configuration comes from Sleeper's own league settings wherever Sleeper has
 * the value, mirroring how `resolveNflWeek` prefers `settings.leg` over a
 * local estimate. That keeps the league's rules in one place rather than
 * drifting between Sleeper and this app.
 */

import type {
  ComplianceContext,
  ComplianceFinding,
  CompliancePlayer,
  RosterCapBreakdown,
} from './types';
import type { ReplayableTransaction, RosterState } from './rosterReplay';
import { isOverCap } from './capProjection';

const playerName = (players: Record<string, CompliancePlayer>, playerId: string): string => {
  const player = players?.[playerId];
  if (!player) return `Player ${playerId}`;
  const full = player.full_name || [player.first_name, player.last_name].filter(Boolean).join(' ');
  return full || `Player ${playerId}`;
};

const transactionWeek = (tx: ReplayableTransaction): number | undefined => {
  const raw = typeof tx?.leg === 'number' ? tx.leg : tx?.week;
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : undefined;
};

/**
 * Cap commitment for one roster given a set of players.
 *
 * IR membership is taken from the *current* roster, even when scoring a past
 * transaction: Sleeper does not log IR moves as transactions, so there is no
 * way to know who was on IR back then. Stated plainly rather than hidden,
 * because it means a team that later parked someone on IR can look retro-
 * actively compliant. The `ir_stash` rule is what catches that abuse.
 */
export const capBreakdownFor = (
  ctx: ComplianceContext,
  rosterId: number,
  members: Set<string>,
): RosterCapBreakdown => {
  const currentlyReserved = new Set<string>(
    (ctx.rosters || []).find((r) => r?.roster_id === rosterId)?.reserve || [],
  );

  let active = 0;
  members.forEach((playerId) => {
    if (currentlyReserved.has(playerId)) return;
    active += ctx.getSalaryCapContribution(playerId) || 0;
  });

  const deadCap = ctx.deadCapByRoster?.[rosterId] || 0;
  return { active, deadCap, total: active + deadCap };
};

/** Roster ids a transaction actually touched. */
const rostersTouched = (tx: {
  adds?: Record<string, unknown> | null;
  drops?: Record<string, unknown> | null;
}): number[] => {
  const ids = new Set<number>();
  [tx?.adds, tx?.drops].forEach((entries) => {
    if (!entries || typeof entries !== 'object') return;
    Object.values(entries).forEach((raw) => {
      const rosterId = typeof raw === 'string' ? Number(raw) : raw;
      if (typeof rosterId === 'number' && Number.isInteger(rosterId)) ids.add(rosterId);
    });
  });
  return [...ids];
};

/**
 * A transaction may not leave a roster over the salary cap.
 *
 * This is the rule the trade simulator has always enforced against
 * hypothetical trades; here it runs against the ones that actually happened.
 * Both call this function, so a trade a manager simulates and the same trade
 * once completed can never get different verdicts.
 *
 * Dead cap counts toward the total, matching how the app reports cap status
 * everywhere else — money committed to players no longer rostered is exactly
 * what a dead cap penalty is for.
 */
export const capCeilingRule = (ctx: ComplianceContext): ComplianceFinding[] => {
  if (!(ctx.salaryCap > 0)) return [];

  const findings: ComplianceFinding[] = [];

  ctx.replay.ordered.forEach((tx) => {
    const txId = String(tx.transaction_id);
    const after: RosterState | undefined = ctx.replay.stateAfter.get(txId);
    const before: RosterState | undefined = ctx.replay.stateBefore.get(txId);
    if (!after) return;

    rostersTouched(tx).forEach((rosterId) => {
      const members = after.get(rosterId);
      if (!members) return;

      const post = capBreakdownFor(ctx, rosterId, members);
      if (!isOverCap(post.total, ctx.salaryCap)) return;

      const priorMembers = before?.get(rosterId);
      const prior = priorMembers ? capBreakdownFor(ctx, rosterId, priorMembers) : null;

      // Only report transactions that *caused* the overage. A team already
      // over the cap trips every subsequent transaction otherwise, burying
      // the one that actually broke the rule.
      if (prior && isOverCap(prior.total, ctx.salaryCap)) return;

      findings.push({
        id: `cap_ceiling:${txId}:${rosterId}`,
        rule: 'cap_ceiling',
        severity: 'violation',
        rosterId,
        transactionId: txId,
        week: transactionWeek(tx),
        summary: `${ctx.teamName(rosterId)} is $${post.total - ctx.salaryCap} over the cap after this ${
          tx.type === 'trade' ? 'trade' : 'transaction'
        }`,
        detail: {
          transactionType: tx.type ?? 'unknown',
          salaryCap: ctx.salaryCap,
          before: prior,
          after: post,
          overBy: post.total - ctx.salaryCap,
          playersIn: Object.keys(tx.adds || {})
            .filter((id) => members.has(id))
            .map((id) => ({ playerId: id, name: playerName(ctx.players, id) })),
          playersOut: Object.keys(tx.drops || {}).map((id) => ({
            playerId: id,
            name: playerName(ctx.players, id),
          })),
        },
      });
    });
  });

  return findings;
};

/**
 * No trades after the league's deadline.
 *
 * Sleeper stores `settings.trade_deadline` as a week number, so no extra
 * configuration is needed. When the league hasn't set one, the rule is
 * simply inert rather than guessing a default.
 */
export const tradeDeadlineRule = (ctx: ComplianceContext): ComplianceFinding[] => {
  const deadline = Number(ctx.league?.settings?.trade_deadline);
  if (!Number.isFinite(deadline) || deadline <= 0) return [];

  const findings: ComplianceFinding[] = [];

  ctx.replay.ordered.forEach((tx) => {
    if (tx.type !== 'trade') return;
    const week = transactionWeek(tx);
    if (week === undefined || week <= deadline) return;

    const txId = String(tx.transaction_id);
    rostersTouched(tx).forEach((rosterId) => {
      findings.push({
        id: `trade_deadline:${txId}:${rosterId}`,
        rule: 'trade_deadline',
        severity: 'violation',
        rosterId,
        transactionId: txId,
        week,
        summary: `${ctx.teamName(rosterId)} traded in week ${week}, after the week ${deadline} deadline`,
        detail: { week, deadline, transactionType: tx.type },
      });
    });
  });

  return findings;
};

/**
 * Taxi squads are for young players. Sleeper's `settings.taxi_years` is the
 * maximum years of experience allowed on the taxi squad — 0 meaning rookies
 * only. A veteran parked there is roster space (and, in leagues that discount
 * taxi salaries, cap space) the league never intended.
 *
 * Evaluated against current rosters rather than the transaction log, since
 * Sleeper doesn't record taxi moves as transactions.
 */
export const taxiEligibilityRule = (ctx: ComplianceContext): ComplianceFinding[] => {
  const maxYears = Number(ctx.league?.settings?.taxi_years);
  if (!Number.isFinite(maxYears)) return [];

  const findings: ComplianceFinding[] = [];

  (ctx.rosters || []).forEach((roster) => {
    const rosterId = roster?.roster_id;
    if (typeof rosterId !== 'number') return;

    (roster.taxi || []).forEach((playerId) => {
      const player = ctx.players?.[playerId];
      const yearsExp = player?.years_exp;
      // Unknown experience is not evidence of a violation.
      if (typeof yearsExp !== 'number' || !Number.isFinite(yearsExp)) return;
      if (yearsExp <= maxYears) return;

      findings.push({
        id: `taxi_eligibility:${rosterId}:${playerId}`,
        rule: 'taxi_eligibility',
        severity: 'violation',
        rosterId,
        summary: `${playerName(ctx.players, playerId)} has ${yearsExp} years of experience but is on ${ctx.teamName(
          rosterId,
        )}'s taxi squad (limit ${maxYears})`,
        detail: {
          playerId,
          playerName: playerName(ctx.players, playerId),
          position: player?.position ?? null,
          yearsExp,
          maxYears,
        },
      });
    });
  });

  return findings;
};

/**
 * Healthy players parked on IR.
 *
 * This one matters more than it looks. Reserve players are excluded from the
 * cap hit, so IR is a place to hide salary — and unlike the taxi squad there
 * is no roster-size pressure pushing back. Without this rule, stashing a
 * healthy starter on IR is a free and completely invisible way to duck the
 * cap.
 *
 * Reported as a warning rather than a violation: Sleeper's injury data lags
 * real life, and a player can be legitimately IR-eligible while showing as
 * active. The commissioner decides.
 */
const INJURED_STATUSES = new Set(['ir', 'out', 'doubtful', 'pup', 'sus', 'na', 'questionable']);

export const irStashRule = (ctx: ComplianceContext): ComplianceFinding[] => {
  const findings: ComplianceFinding[] = [];

  (ctx.rosters || []).forEach((roster) => {
    const rosterId = roster?.roster_id;
    if (typeof rosterId !== 'number') return;

    (roster.reserve || []).forEach((playerId) => {
      const player = ctx.players?.[playerId];
      const status = String(player?.injury_status ?? '').trim().toLowerCase();
      if (status && INJURED_STATUSES.has(status)) return;

      const shelteredSalary = ctx.getSalaryCapContribution(playerId) || 0;

      findings.push({
        id: `ir_stash:${rosterId}:${playerId}`,
        rule: 'ir_stash',
        severity: 'warning',
        rosterId,
        summary: `${playerName(ctx.players, playerId)} is on ${ctx.teamName(
          rosterId,
        )}'s IR with no injury designation, sheltering $${shelteredSalary} from the cap`,
        detail: {
          playerId,
          playerName: playerName(ctx.players, playerId),
          position: player?.position ?? null,
          injuryStatus: player?.injury_status ?? null,
          shelteredSalary,
        },
      });
    });
  });

  return findings;
};

export const ALL_RULES = [
  capCeilingRule,
  tradeDeadlineRule,
  taxiEligibilityRule,
  irStashRule,
] as const;

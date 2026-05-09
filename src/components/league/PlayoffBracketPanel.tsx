import React, { useMemo } from 'react';
import { TurfPanel } from '@/components/ui/turf-panel';
import { getTeamName } from '@/utils/leagueDataUtils';
import type { SleeperBracketEntry } from '@/hooks/useGamificationInsights';
import type { SleeperRoster, SleeperUserMap } from '@/types/sleeper';

interface PlayoffBracketPanelProps {
  bracket: SleeperBracketEntry[];
  rosters: SleeperRoster[];
  userMap: SleeperUserMap;
  /** "Winners" or "Losers" — used for the kicker label. */
  variant?: 'winners' | 'losers';
}

interface NormalizedMatchup {
  round: number;
  matchupId: number;
  team1Id?: number;
  team2Id?: number;
  team1Score?: number;
  team2Score?: number;
  winnerId?: number;
  loserId?: number;
  placement?: number;
}

/**
 * Round labels for the most common Sleeper bracket sizes:
 *   - 4 teams: rounds 1, 2 → semis, finals
 *   - 6 teams: rounds 1, 2, 3 → wild card, semis, finals
 *   - 8 teams: rounds 1, 2, 3 → quarters, semis, finals
 *
 * Sleeper doesn't tell us which structure the league uses, so we infer
 * from the highest round number seen in the bracket.
 */
const roundLabel = (round: number, totalRounds: number): string => {
  if (totalRounds <= 0) return `Round ${round}`;
  const fromEnd = totalRounds - round;
  if (fromEnd === 0) return 'Championship';
  if (fromEnd === 1) return 'Semifinals';
  if (fromEnd === 2) return totalRounds === 3 ? 'Wild Card' : 'Quarterfinals';
  if (fromEnd === 3) return 'Wild Card';
  return `Round ${round}`;
};

const NUMERIC_FIELDS = ['t1', 't2', 'w', 'l', 'r', 'm', 'p'] as const;

const num = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return undefined;
};

const normalize = (entries: SleeperBracketEntry[]): NormalizedMatchup[] =>
  entries
    .map((entry) => {
      // Coerce since SleeperBracketEntry is loosely typed.
      const e = entry as Record<string, unknown>;
      const round = num(e.r) ?? 0;
      const matchupId = num(e.m) ?? 0;
      return {
        round,
        matchupId,
        team1Id: num(e.t1),
        team2Id: num(e.t2),
        team1Score: typeof e.t1_score === 'number' ? e.t1_score : undefined,
        team2Score: typeof e.t2_score === 'number' ? e.t2_score : undefined,
        winnerId: num(e.w),
        loserId: num(e.l),
        placement: num(e.p),
      } satisfies NormalizedMatchup;
    })
    .filter((m) => m.round > 0)
    .sort((a, b) => a.round - b.round || a.matchupId - b.matchupId);

export const PlayoffBracketPanel: React.FC<PlayoffBracketPanelProps> = ({
  bracket,
  rosters,
  userMap,
  variant = 'winners',
}) => {
  const matchups = useMemo(() => normalize(bracket), [bracket]);

  const teamLabel = useMemo(() => {
    const map = new Map<number, string>();
    rosters.forEach((roster) => {
      map.set(roster.roster_id, getTeamName(userMap[roster.owner_id]));
    });
    return (rosterId: number | undefined) =>
      typeof rosterId === 'number' ? map.get(rosterId) || `Team ${rosterId}` : 'TBD';
  }, [rosters, userMap]);

  const totalRounds = matchups.reduce((acc, m) => Math.max(acc, m.round), 0);

  const grouped = useMemo(() => {
    const map = new Map<number, NormalizedMatchup[]>();
    matchups.forEach((m) => {
      const list = map.get(m.round) || [];
      list.push(m);
      map.set(m.round, list);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [matchups]);

  if (matchups.length === 0) {
    return null;
  }

  const kicker = variant === 'losers' ? 'CONSOLATION BRACKET' : 'PLAYOFF BRACKET';
  const title = variant === 'losers' ? 'Toilet Bowl' : 'Championship Run';

  return (
    <TurfPanel kicker={kicker} title={title} big>
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${grouped.length}, minmax(180px, 1fr))`,
        }}
      >
        {grouped.map(([round, list]) => (
          <div key={round} className="space-y-2">
            <div
              className="font-mono font-bold text-primary mb-2"
              style={{ fontSize: 10, letterSpacing: '0.2em' }}
            >
              ● {roundLabel(round, totalRounds).toUpperCase()}
            </div>
            <div className="space-y-3">
              {list.map((matchup) => {
                const t1Name = teamLabel(matchup.team1Id);
                const t2Name = teamLabel(matchup.team2Id);
                const t1IsWinner =
                  matchup.winnerId !== undefined && matchup.team1Id === matchup.winnerId;
                const t2IsWinner =
                  matchup.winnerId !== undefined && matchup.team2Id === matchup.winnerId;
                const decided = matchup.winnerId !== undefined;
                return (
                  <div
                    key={`${round}-${matchup.matchupId}`}
                    className="bg-card border border-border"
                    style={
                      matchup.placement === 1
                        ? { borderColor: 'hsl(var(--primary))', borderTopWidth: 2 }
                        : undefined
                    }
                  >
                    <BracketRow
                      name={t1Name}
                      score={matchup.team1Score}
                      isWinner={t1IsWinner}
                      isLoser={decided && !t1IsWinner && matchup.team1Id !== undefined}
                      tbd={matchup.team1Id === undefined}
                    />
                    <div className="border-t border-border" />
                    <BracketRow
                      name={t2Name}
                      score={matchup.team2Score}
                      isWinner={t2IsWinner}
                      isLoser={decided && !t2IsWinner && matchup.team2Id !== undefined}
                      tbd={matchup.team2Id === undefined}
                    />
                    {matchup.placement === 1 && (
                      <div
                        className="px-2.5 py-1 font-mono font-bold text-primary border-t border-border"
                        style={{ fontSize: 9, letterSpacing: '0.2em' }}
                      >
                        🏆 CHAMPION
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </TurfPanel>
  );
};

interface BracketRowProps {
  name: string;
  score?: number;
  isWinner?: boolean;
  isLoser?: boolean;
  tbd?: boolean;
}

const BracketRow: React.FC<BracketRowProps> = ({ name, score, isWinner, isLoser, tbd }) => {
  return (
    <div
      className={`flex items-center justify-between gap-2 px-3 py-2 ${
        isWinner ? 'text-foreground font-semibold' : 'text-muted-foreground'
      }`}
      style={isLoser ? { textDecoration: 'line-through', opacity: 0.6 } : undefined}
    >
      <span
        className="text-xs truncate flex-1 min-w-0"
        title={name}
        style={tbd ? { fontStyle: 'italic', opacity: 0.5 } : undefined}
      >
        {tbd ? 'TBD' : name}
      </span>
      <span
        className={`font-mono text-xs flex-shrink-0 ${isWinner ? 'text-primary' : ''}`}
        style={{ minWidth: 36, textAlign: 'right' }}
      >
        {typeof score === 'number' ? score.toFixed(1) : '—'}
      </span>
    </div>
  );
};

export default PlayoffBracketPanel;

// Re-export the hook's bracket type so consumers don't need to know the
// internal hook path just to type-annotate.
export type { SleeperBracketEntry } from '@/hooks/useGamificationInsights';

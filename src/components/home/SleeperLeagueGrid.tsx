import React from 'react';
import { Trophy } from 'lucide-react';
import type { SleeperLeague } from '@/types/sleeper';

interface SleeperLeagueGridProps {
  leagues: SleeperLeague[];
  onSelectLeague: (leagueId: string) => void;
  loading?: boolean;
}

const STATUS_PALETTES: Record<
  string,
  { label: string; bg: string; fg: string; border: string }
> = {
  in_season: {
    label: 'ACTIVE',
    bg: 'hsl(var(--primary))',
    fg: 'hsl(var(--primary-foreground))',
    border: 'transparent',
  },
  drafting: {
    label: 'DRAFTING',
    bg: 'hsl(var(--primary))',
    fg: 'hsl(var(--primary-foreground))',
    border: 'transparent',
  },
  pre_draft: {
    label: 'PRE-DRAFT',
    bg: 'transparent',
    fg: 'hsl(var(--primary))',
    border: 'hsl(var(--primary))',
  },
  complete: {
    label: 'COMPLETE',
    bg: 'transparent',
    fg: 'hsl(var(--muted-foreground))',
    border: 'hsl(var(--border-light))',
  },
};

const ACCENTS = [
  '#fb923c',
  '#22d3ee',
  '#a78bfa',
  '#f472b6',
  '#34d399',
  '#60a5fa',
  '#fbbf24',
  '#f87171',
];

const accentForLeague = (leagueId: string): string => {
  let hash = 0;
  for (let i = 0; i < leagueId.length; i++) hash = (hash * 31 + leagueId.charCodeAt(i)) >>> 0;
  return ACCENTS[hash % ACCENTS.length];
};

export const SleeperLeagueGrid: React.FC<SleeperLeagueGridProps> = ({
  leagues,
  onSelectLeague,
  loading = false,
}) => {
  if (leagues.length === 0) {
    return (
      <div className="bg-card border border-border px-6 py-10 text-center">
        <div className="text-foreground mb-2 font-headline font-bold uppercase" style={{ letterSpacing: '0.1em' }}>
          No leagues found
        </div>
        <p className="text-sm text-muted-foreground">
          Make sure you've joined NFL leagues in Sleeper for the current season.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className="font-mono font-semibold text-muted-foreground"
        style={{ fontSize: 11, letterSpacing: '0.25em' }}
      >
        ● 02 / YOUR LEAGUES
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {leagues.map((league, index) => {
          const accent = accentForLeague(league.league_id);
          const statusKey = String(league.status || '').toLowerCase();
          const palette =
            STATUS_PALETTES[statusKey] || {
              label: (league.status || 'UNKNOWN').toUpperCase(),
              bg: 'transparent',
              fg: 'hsl(var(--muted-foreground))',
              border: 'hsl(var(--border-light))',
            };
          const isPrimary = index === 0;

          return (
            <div
              key={league.league_id}
              className="bg-card border border-border px-5 py-5 sm:px-6 sm:py-6"
              style={{ borderLeft: `4px solid ${accent}` }}
            >
              <div className="flex items-start gap-4 mb-5">
                <div
                  className="flex-shrink-0 w-12 h-12 flex items-center justify-center"
                  style={{ background: accent }}
                >
                  <Trophy className="w-5 h-5 text-black" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4
                    className="font-headline font-bold uppercase text-foreground m-0"
                    style={{ fontSize: 20, letterSpacing: '0.025em', lineHeight: 1.1 }}
                    title={league.name}
                  >
                    {league.name}
                  </h4>
                  <div
                    className="font-mono text-muted-foreground mt-1.5"
                    style={{ fontSize: 10, letterSpacing: '0.15em' }}
                  >
                    SEASON {league.season} · {league.total_rosters} TEAMS
                  </div>
                </div>
                <span
                  className="font-mono font-bold flex-shrink-0"
                  style={{
                    fontSize: 9,
                    letterSpacing: '0.15em',
                    padding: '3px 8px',
                    color: palette.fg,
                    background: palette.bg,
                    border: palette.border === 'transparent' ? 'none' : `1px solid ${palette.border}`,
                  }}
                >
                  ● {palette.label}
                </span>
              </div>

              <div
                className="grid grid-cols-3 mb-5"
                style={{ borderTop: '1px solid hsl(var(--border))', borderBottom: '1px solid hsl(var(--border))' }}
              >
                {[
                  { label: 'TEAMS', value: String(league.total_rosters || 0) },
                  { label: 'TYPE', value: (league.settings?.type === 2 ? 'DYN' : league.settings?.type === 1 ? 'KEEP' : 'STD') },
                  { label: 'WEEK', value: league.season ? String(league.settings?.leg ?? league.settings?.week ?? '—') : '—' },
                ].map((s, i) => (
                  <div
                    key={s.label}
                    className="px-3 py-2.5"
                    style={{ borderRight: i < 2 ? '1px solid hsl(var(--border))' : 'none' }}
                  >
                    <div
                      className="font-mono text-muted-foreground"
                      style={{ fontSize: 9, letterSpacing: '0.15em' }}
                    >
                      {s.label}
                    </div>
                    <div
                      className="font-headline font-bold text-foreground mt-0.5"
                      style={{ fontSize: 18 }}
                    >
                      {s.value}
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => onSelectLeague(league.league_id)}
                disabled={loading}
                className={`w-full inline-flex items-center justify-center px-5 py-3.5 font-headline font-bold uppercase transition-colors disabled:opacity-60 ${
                  isPrimary
                    ? 'bg-primary text-primary-foreground hover:bg-primary-glow border-0'
                    : 'bg-transparent text-foreground border hover:border-primary/60'
                }`}
                style={{
                  fontSize: 14,
                  letterSpacing: '0.15em',
                  borderColor: isPrimary ? undefined : 'hsl(var(--border-light))',
                  clipPath: isPrimary ? 'polygon(4% 0, 100% 0, 96% 100%, 0 100%)' : undefined,
                }}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  'OPEN LEAGUE →'
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

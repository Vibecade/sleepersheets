import React from 'react';
import { describeLeagueWeek } from '@/utils/nflWeek';

interface LeagueHeaderProps {
  league: any;
  transactionCount: number;
  draftPickCount: number;
  draftCount: number;
  /**
   * Renders the slim mobile pill layout instead of the full Turf hero.
   * Parent passes `isMobile`; no manual toggle anymore — we used to surface
   * Refresh/Compact buttons here but data refreshes are handled by
   * TanStack Query and density auto-detects from the viewport.
   */
  compact?: boolean;
}

const splitLeagueName = (raw: string): [string, string] => {
  const name = (raw || '').trim();
  if (!name) return ['LEAGUE', ''];
  const tokens = name.split(/\s+/);
  if (tokens.length === 1) return [tokens[0], ''];
  // Highlight the last word in the accent color (matches the "League." mark in the design).
  const head = tokens.slice(0, -1).join(' ');
  const tail = tokens[tokens.length - 1];
  return [head, tail];
};

const formatScoringMode = (league: any): string => {
  const settings = league?.settings || {};
  const scoring = league?.scoring_settings || {};
  const isPpr = Number(scoring?.rec || 0) >= 0.95;
  const isHalfPpr = Number(scoring?.rec || 0) >= 0.45 && Number(scoring?.rec || 0) < 0.95;
  const positions: string[] = Array.isArray(league?.roster_positions) ? league.roster_positions : [];
  const isSuperflex = positions.filter((p) => p === 'QB' || p === 'SUPER_FLEX').length >= 2;
  const isDynasty = settings?.type === 2 || /dynasty|keeper/i.test(String(league?.name || ''));

  const parts = [
    isDynasty ? 'DYNASTY' : settings?.type === 1 ? 'KEEPER' : 'REDRAFT',
    isPpr ? 'PPR' : isHalfPpr ? 'HALF-PPR' : 'STD',
  ];
  if (isSuperflex) parts.push('SUPERFLEX');
  return parts.join(' · ');
};

const StatCell: React.FC<{
  label: string;
  value: React.ReactNode;
  sub?: string;
  alert?: boolean;
  isLast?: boolean;
  isHidden?: boolean;
}> = ({ label, value, sub, alert, isLast, isHidden }) => (
  <div
    className={`relative px-4 py-5 sm:px-6 ${isLast ? '' : 'border-b sm:border-b-0 sm:border-r'} border-border ${
      isHidden ? 'hidden lg:block' : ''
    }`}
  >
    {alert && <span aria-hidden className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />}
    <div
      className="font-mono font-semibold text-muted-foreground mb-2"
      style={{ fontSize: 10, letterSpacing: '0.2em' }}
    >
      {label}
    </div>
    <div
      className={`font-headline font-bold leading-none ${alert ? 'text-primary' : 'text-foreground'}`}
      style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', letterSpacing: '-0.02em' }}
    >
      {value}
    </div>
    {sub && (
      <div
        className="font-mono text-muted-foreground mt-1.5"
        style={{ fontSize: 9, letterSpacing: '0.15em' }}
      >
        {sub}
      </div>
    )}
  </div>
);

const LeagueHeader: React.FC<LeagueHeaderProps> = ({
  league,
  transactionCount,
  draftPickCount,
  draftCount,
  compact = false,
}) => {
  const [headLine, tailLine] = splitLeagueName(league?.name || 'LEAGUE');
  const { week, label: weekLabel, isPreseason } = describeLeagueWeek(league);

  // Compact mobile pill (kept simple — used inline above the bottom-nav)
  if (compact) {
    return (
      <div className="bg-card border border-border px-4 py-3">
        <div
          className="font-mono text-[9px] text-primary font-semibold mb-1"
          style={{ letterSpacing: '0.2em' }}
        >
          {isPreseason ? '● PRESEASON' : `● WK ${week} · LIVE`}
        </div>
        <h2
          className="font-headline font-bold uppercase text-foreground m-0 truncate"
          style={{ fontSize: 18, letterSpacing: '-0.005em', lineHeight: 1.05 }}
          title={league?.name || ''}
        >
          {league?.name}
        </h2>
        <div
          className="font-mono text-[10px] text-muted-foreground mt-1"
          style={{ letterSpacing: '0.1em' }}
        >
          S{league?.season} · {league?.total_rosters} TEAMS
        </div>
      </div>
    );
  }

  // Full Turf Field hero
  return (
    <section className="fade-in">
      {/* Top row: massive league name. The button column (Refresh / Compact)
          used to live in a second grid column here — both are gone now since
          data refreshes are handled by TanStack Query and density auto-detects
          from the viewport. */}
      <div className="mb-6">
        <div
          className="font-mono font-semibold text-primary mb-2"
          style={{ fontSize: 11, letterSpacing: '0.25em' }}
        >
          ● COMMISSIONER VIEW / SEASON {league?.season} / {weekLabel}
        </div>
        <h1
          className="font-headline font-bold uppercase text-foreground m-0"
          style={{
            fontSize: 'clamp(40px, 7vw, 88px)',
            letterSpacing: '-0.01em',
            lineHeight: 0.92,
          }}
        >
          {headLine}
          {tailLine && (
            <>
              <br />
              <span className="text-primary">{tailLine}.</span>
            </>
          )}
        </h1>
        <div
          className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-muted-foreground"
          style={{ fontSize: 12, letterSpacing: '0.1em' }}
        >
          <span>ID {league?.league_id}</span>
          <span>{league?.total_rosters || 0} FRANCHISES</span>
          <span>{formatScoringMode(league)}</span>
        </div>
      </div>

      {/* Stat strip */}
      <div className="border-y border-border grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 -mx-4 sm:mx-0">
        <StatCell
          label="TEAMS"
          value={league?.total_rosters || 0}
          sub={`OF ${league?.total_rosters || 0} ACTIVE`}
        />
        <StatCell label="TRANSACTIONS" value={transactionCount} sub="THIS SEASON" />
        <StatCell label="PICKS TRADED" value={draftPickCount} sub="ALL DRAFTS" />
        <StatCell
          label="DRAFTS"
          value={draftCount}
          sub={draftCount === 1 ? 'COMPLETE' : 'ON RECORD'}
          isHidden
        />
        <StatCell
          label="WEEK"
          value={`WK ${week}`}
          sub={`SEASON ${league?.season}`}
          alert
          isLast
        />
      </div>
    </section>
  );
};

export default LeagueHeader;

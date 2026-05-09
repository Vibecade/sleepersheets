import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Minimize2, Maximize2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LeagueHeaderProps {
  league: any;
  transactionCount: number;
  draftPickCount: number;
  draftCount: number;
  onRefreshData?: () => Promise<void>;
  compact?: boolean;
  isCompactMode?: boolean;
  onToggleCompactMode?: () => void;
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

const formatRelative = (date: Date | null): string => {
  if (!date) return 'JUST NOW';
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return `${seconds}s AGO`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m AGO`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h AGO`;
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
  onRefreshData,
  compact = false,
  isCompactMode = false,
  onToggleCompactMode,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const { toast } = useToast();

  const [headLine, tailLine] = splitLeagueName(league?.name || 'LEAGUE');
  const week = league?.settings?.leg ?? league?.settings?.week ?? 0;
  const playoffStart = Number(league?.settings?.playoff_week_start) || 0;
  const totalWeeks = playoffStart > 1 ? playoffStart - 1 : 17;

  const handleRefresh = async () => {
    if (!onRefreshData || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefreshData();
      setLastRefreshed(new Date());
      toast({ title: 'Data refreshed', description: 'League data has been updated.' });
    } catch {
      toast({
        title: 'Refresh failed',
        description: 'Failed to refresh league data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Compact mobile pill (kept simple — used inline above the bottom-nav)
  if (compact) {
    return (
      <div className="bg-card border border-border px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div
            className="font-mono text-[9px] text-primary font-semibold mb-1"
            style={{ letterSpacing: '0.2em' }}
          >
            ● WK {week} · LIVE
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
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {onToggleCompactMode && (
            <Button
              onClick={onToggleCompactMode}
              size="icon"
              variant="ghost"
              aria-label={isCompactMode ? 'Expand spacing' : 'Use compact spacing'}
              title={isCompactMode ? 'Expand spacing' : 'Use compact spacing'}
            >
              {isCompactMode ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
          )}
          {onRefreshData && (
            <Button onClick={handleRefresh} disabled={isRefreshing} size="icon" variant="ghost">
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Full Turf Field hero
  return (
    <section className="fade-in">
      {/* Top row: massive league name + actions */}
      <div className="grid gap-6 md:gap-8 md:grid-cols-[1fr_auto] items-end mb-6">
        <div>
          <div
            className="font-mono font-semibold text-primary mb-2"
            style={{ fontSize: 11, letterSpacing: '0.25em' }}
          >
            ● COMMISSIONER VIEW / SEASON {league?.season} / WEEK {week} OF {totalWeeks}
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
            <span className="text-primary">● SYNCED {formatRelative(lastRefreshed)}</span>
          </div>
        </div>

        <div className="flex items-stretch gap-2 min-w-[260px]">
          {onRefreshData && (
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-transparent border border-border-light text-foreground font-mono text-[11px] font-semibold uppercase hover:border-primary/60 transition-colors disabled:opacity-60"
              style={{ letterSpacing: '0.15em', borderColor: 'hsl(var(--border-light))' }}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing' : 'Refresh'}
            </button>
          )}
          {onToggleCompactMode && (
            <button
              type="button"
              onClick={onToggleCompactMode}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-transparent border text-foreground font-mono text-[11px] font-semibold uppercase hover:border-primary/60 transition-colors"
              style={{ letterSpacing: '0.15em', borderColor: 'hsl(var(--border-light))' }}
            >
              {isCompactMode ? (
                <Maximize2 className="w-4 h-4" />
              ) : (
                <Minimize2 className="w-4 h-4" />
              )}
              Compact
            </button>
          )}
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

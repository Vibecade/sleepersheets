import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarClock, Users, ListChecks, ClipboardList } from 'lucide-react';
import { getCurrentNFLWeek } from '@/utils/nflWeek';

interface LeagueAtAGlanceProps {
  league: any;
  rosters: any[];
  transactions?: any[];
}

/**
 * Tiny "always has data" panel that anchors the Statistics tab. Power
 * rankings / streaks / activity below it depend on regular-season W-L data
 * and look empty in the offseason; these counts work year-round.
 */
const LeagueAtAGlance: React.FC<LeagueAtAGlanceProps> = ({
  league,
  rosters,
  transactions = [],
}) => {
  const teamCount = rosters.length;

  const totalPlayersRostered = useMemo(() => {
    return rosters.reduce((sum, r) => {
      const active = r.players?.length || 0;
      const taxi = r.taxi?.length || 0;
      const reserve = r.reserve?.length || 0;
      return sum + active + taxi + reserve;
    }, 0);
  }, [rosters]);

  // Sleeper league.status values: 'pre_draft' | 'drafting' | 'in_season' |
  // 'complete'. Translate to a friendly week label.
  const { weekLabel, weekSubtitle } = useMemo(() => {
    const status: string | undefined = league?.status;
    if (status === 'in_season') {
      const week = getCurrentNFLWeek(league?.season);
      return { weekLabel: `WK ${week}`, weekSubtitle: 'regular season' };
    }
    if (status === 'pre_draft') {
      return { weekLabel: 'OFFSEASON', weekSubtitle: 'pre-draft' };
    }
    if (status === 'drafting') {
      return { weekLabel: 'DRAFT', weekSubtitle: 'in progress' };
    }
    if (status === 'complete') {
      return { weekLabel: 'COMPLETE', weekSubtitle: `${league?.season ?? ''} wrapped` };
    }
    return { weekLabel: 'OFFSEASON', weekSubtitle: league?.season ? `${league.season} season` : '' };
  }, [league?.status, league?.season]);

  const Stat = ({
    icon: Icon,
    label,
    value,
    subtitle,
  }: {
    icon: typeof Users;
    label: string;
    value: string;
    subtitle?: string;
  }) => (
    <div className="rounded-lg border border-border-light bg-card-light/40 p-3 min-w-[150px] flex-shrink-0 sm:min-w-0">
      <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold leading-tight text-primary">{value}</div>
      {subtitle && (
        <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">League at a Glance</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible">
          <Stat
            icon={CalendarClock}
            label="Right now"
            value={weekLabel}
            subtitle={weekSubtitle}
          />
          <Stat
            icon={Users}
            label="Teams"
            value={String(teamCount)}
            subtitle={league?.season ? `${league.season} season` : undefined}
          />
          <Stat
            icon={ClipboardList}
            label="Players rostered"
            value={String(totalPlayersRostered)}
            subtitle="active + taxi + reserve"
          />
          <Stat
            icon={ListChecks}
            label="Transactions"
            value={String(transactions.length)}
            subtitle="all-time, this league"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default LeagueAtAGlance;

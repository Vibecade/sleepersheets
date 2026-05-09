import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowDownAZ, ArrowDownWideNarrow, Calendar, ChevronDown, ChevronUp, Wallet, AlertTriangle } from 'lucide-react';
import { usePlayerAcquisitions } from '@/hooks/usePlayerAcquisitions';
import { formatPlayerName } from '@/utils/csvExport';
import { getTeamName } from '@/utils/leagueDataUtils';

interface WaiverAcquisitionsPanelProps {
  leagueData: {
    rosters?: any[];
    transactions?: any[];
    draftPicks?: any[];
    players?: Record<string, any>;
    users?: any[];
    userMap?: Record<string, any>;
    league?: any;
  };
}

type SortMode = 'recent' | 'faab' | 'name';

const fmtCurrency = (n: number): string => `$${n.toLocaleString()}`;

const fmtDate = (ms: number | null): string => {
  if (!ms) return '—';
  const date = new Date(ms);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const POSITION_TONES: Record<string, string> = {
  QB: 'bg-red-500/15 text-red-300 border-red-500/30',
  RB: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  WR: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  TE: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  K: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  DEF: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
};

const positionTone = (pos?: string): string =>
  POSITION_TONES[String(pos || '').toUpperCase()] || 'bg-muted text-muted-foreground border-border';

const EMPTY_ARRAY: never[] = [];
const EMPTY_RECORD: Record<string, never> = {};

export const WaiverAcquisitionsPanel: React.FC<WaiverAcquisitionsPanelProps> = ({ leagueData }) => {
  // Stabilise the optional/falsy fields so downstream hooks don't see a new
  // reference every render (eslint react-hooks/exhaustive-deps).
  const rosters = useMemo(
    () => leagueData?.rosters ?? (EMPTY_ARRAY as any[]),
    [leagueData?.rosters],
  );
  const transactions = useMemo(
    () => leagueData?.transactions ?? (EMPTY_ARRAY as any[]),
    [leagueData?.transactions],
  );
  const draftPicks = useMemo(
    () => leagueData?.draftPicks ?? (EMPTY_ARRAY as any[]),
    [leagueData?.draftPicks],
  );
  const players = useMemo(
    () => leagueData?.players ?? (EMPTY_RECORD as Record<string, any>),
    [leagueData?.players],
  );
  const userMap = useMemo(() => {
    if (leagueData?.userMap) return leagueData.userMap;
    const map: Record<string, any> = {};
    (leagueData?.users || []).forEach((user: any) => {
      if (user?.user_id) map[user.user_id] = user;
    });
    return map;
  }, [leagueData?.userMap, leagueData?.users]);

  const { waiverByRoster } = usePlayerAcquisitions({ rosters, transactions, draftPicks });

  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  const teamSummaries = useMemo(() => {
    return rosters.map((roster: any) => {
      const list = waiverByRoster.get(roster.roster_id) || [];
      const totalFaab = list.reduce((acc, entry) => acc + (entry.faabBid || 0), 0);
      return {
        rosterId: roster.roster_id,
        roster,
        teamName: getTeamName(userMap[roster.owner_id]),
        ownerName: userMap[roster.owner_id]?.display_name || userMap[roster.owner_id]?.username || '',
        count: list.length,
        totalFaab,
        list,
      };
    });
  }, [rosters, waiverByRoster, userMap]);

  const totals = useMemo(() => {
    return teamSummaries.reduce(
      (acc, team) => {
        acc.players += team.count;
        acc.faab += team.totalFaab;
        if (team.count > 0) acc.teams += 1;
        return acc;
      },
      { players: 0, faab: 0, teams: 0 },
    );
  }, [teamSummaries]);

  const sortedTeams = useMemo(() => {
    const ordered = [...teamSummaries];
    switch (sortMode) {
      case 'faab':
        ordered.sort((a, b) => b.totalFaab - a.totalFaab || b.count - a.count);
        break;
      case 'name':
        ordered.sort((a, b) => a.teamName.localeCompare(b.teamName));
        break;
      case 'recent':
      default:
        ordered.sort((a, b) => {
          const aLatest = a.list[0]?.acquiredAt || 0;
          const bLatest = b.list[0]?.acquiredAt || 0;
          return bLatest - aLatest || b.count - a.count;
        });
        break;
    }
    return ordered;
  }, [teamSummaries, sortMode]);

  if (rosters.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Waiver Acquisitions</CardTitle>
          <CardDescription>Load league data to see waiver pickups.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary" />
                Waiver Acquisitions
              </CardTitle>
              <CardDescription className="mt-1 max-w-2xl">
                Players currently rostered who were claimed off waivers this season. In dynasty
                / keeper formats with RFA rules, these are the players that fall back to a
                restricted free-agent pool at season end — review them before extending or
                cutting.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={sortMode === 'recent' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortMode('recent')}
              >
                <Calendar className="w-3.5 h-3.5 mr-1.5" />
                Most recent
              </Button>
              <Button
                variant={sortMode === 'faab' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortMode('faab')}
              >
                <ArrowDownWideNarrow className="w-3.5 h-3.5 mr-1.5" />
                FAAB spent
              </Button>
              <Button
                variant={sortMode === 'name' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortMode('name')}
              >
                <ArrowDownAZ className="w-3.5 h-3.5 mr-1.5" />
                Team name
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <SummaryStat label="Teams with waivers" value={totals.teams} />
            <SummaryStat label="Players via waivers" value={totals.players} />
            <SummaryStat label="Total FAAB on waivers" value={fmtCurrency(totals.faab)} />
          </div>
          {totals.players === 0 && (
            <Alert className="mt-4">
              No waiver pickups detected on current rosters. (Waiver claims this season have
              either been dropped, traded away, or aren't in the loaded transaction log.)
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Per-team breakdown */}
      <div className="space-y-3">
        {sortedTeams.map((team) => {
          const isCollapsed = collapsed[team.rosterId] ?? team.count === 0;
          if (team.count === 0) return null;
          return (
            <Card key={team.rosterId}>
              <CardHeader
                className="pb-3 cursor-pointer"
                onClick={() =>
                  setCollapsed((prev) => ({ ...prev, [team.rosterId]: !isCollapsed }))
                }
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <span className="truncate" title={team.teamName}>
                        {team.teamName}
                      </span>
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        {team.count} {team.count === 1 ? 'PLAYER' : 'PLAYERS'}
                      </Badge>
                    </CardTitle>
                    {team.ownerName && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        @{team.ownerName} · {fmtCurrency(team.totalFaab)} total FAAB
                      </p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm">
                    {isCollapsed ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronUp className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              {!isCollapsed && (
                <CardContent className="pt-0">
                  <ScrollArea className="max-h-[420px]">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border">
                          <th className="text-left font-medium py-2 pr-3">Player</th>
                          <th className="text-left font-medium py-2 px-3 hidden sm:table-cell">
                            NFL
                          </th>
                          <th className="text-left font-medium py-2 px-3">Pos</th>
                          <th className="text-right font-medium py-2 px-3">FAAB Bid</th>
                          <th className="text-right font-medium py-2 px-3 hidden md:table-cell">
                            Week
                          </th>
                          <th className="text-right font-medium py-2 pl-3">Acquired</th>
                        </tr>
                      </thead>
                      <tbody>
                        {team.list.map((entry) => {
                          const player = players[entry.playerId];
                          return (
                            <tr
                              key={entry.playerId + entry.transactionId}
                              className="border-b border-border/60 last:border-b-0 hover:bg-muted/30 transition-colors"
                            >
                              <td className="py-2 pr-3 align-middle">
                                <div className="font-medium text-foreground">
                                  {player ? formatPlayerName(player) : `player:${entry.playerId}`}
                                </div>
                              </td>
                              <td className="py-2 px-3 align-middle hidden sm:table-cell text-xs text-muted-foreground">
                                {String(player?.team || 'FA')}
                              </td>
                              <td className="py-2 px-3 align-middle">
                                <Badge
                                  variant="outline"
                                  className={`font-mono text-[10px] ${positionTone(player?.position)}`}
                                >
                                  {String(player?.position || '—')}
                                </Badge>
                              </td>
                              <td className="py-2 px-3 align-middle text-right font-mono">
                                {entry.faabBid > 0 ? fmtCurrency(entry.faabBid) : '—'}
                              </td>
                              <td className="py-2 px-3 align-middle text-right hidden md:table-cell text-muted-foreground font-mono">
                                {entry.week ? `WK ${entry.week}` : '—'}
                              </td>
                              <td className="py-2 pl-3 align-middle text-right text-muted-foreground text-xs">
                                {fmtDate(entry.acquiredAt)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </ScrollArea>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

const SummaryStat: React.FC<{ label: string; value: number | string }> = ({ label, value }) => (
  <div className="rounded-md border border-border/60 bg-card/40 p-3">
    <div className="text-xl sm:text-2xl font-bold text-foreground">{value}</div>
    <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide mt-0.5">
      {label}
    </div>
  </div>
);

const Alert: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className = '',
  children,
}) => (
  <div
    className={`flex items-start gap-2 rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-sm text-muted-foreground ${className}`}
  >
    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
    <div>{children}</div>
  </div>
);

export default WaiverAcquisitionsPanel;

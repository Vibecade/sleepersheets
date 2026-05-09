import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLeagueData } from '@/components/LeagueDataContext';
import { useSleeperUser } from '@/hooks/useSleeperUser';
import { useRosterInsights } from '@/hooks/useRosterInsights';
import { getTeamName } from '@/utils/leagueDataUtils';

interface StatTileProps {
  label: string;
  value: string;
  subtitle?: string;
  muted?: boolean;
}

const StatTile: React.FC<StatTileProps> = ({ label, value, subtitle, muted }) => (
  <div className="rounded-lg border border-border-light bg-card-light/40 p-3 min-w-[150px] flex-shrink-0 sm:min-w-0">
    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {label}
    </div>
    <div
      className={cn(
        'mt-1 text-2xl font-bold leading-tight',
        muted ? 'text-muted-foreground' : 'text-primary'
      )}
    >
      {value}
    </div>
    {subtitle && (
      <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{subtitle}</p>
    )}
  </div>
);

const formatCurrency = (amount: number): string => {
  if (!amount) return '$0';
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
  return `$${amount.toFixed(2)}`;
};

const RosterInsightsCard: React.FC = () => {
  const { rosters, userMap } = useLeagueData();
  const { sleeperUser } = useSleeperUser();

  const myRoster = useMemo(() => {
    if (!sleeperUser?.user_id) return null;
    return rosters.find((r: any) => r.owner_id === sleeperUser.user_id) ?? null;
  }, [rosters, sleeperUser?.user_id]);

  const insights = useRosterInsights(myRoster?.roster_id ?? null);

  if (!myRoster || !insights) return null;

  const teamName = getTeamName(userMap[myRoster.owner_id]);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardList className="w-4 h-4 text-primary" />
          Roster Insights
          <span className="text-sm font-normal text-muted-foreground normal-case tracking-normal">
            — {teamName}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 lg:grid-cols-5 sm:overflow-visible">
          <StatTile
            label="Expiring this year"
            value={String(insights.expiringThisYear)}
            subtitle="Will be released at end of season"
            muted={insights.expiringThisYear === 0}
          />
          <StatTile
            label="Final year next year"
            value={String(insights.finalYearNextYear)}
            subtitle="Plan ahead"
            muted={insights.finalYearNextYear === 0}
          />
          <StatTile
            label="No contract on file"
            value={String(insights.noContract)}
            subtitle="Likely waiver pickups — set a length"
            muted={insights.noContract === 0}
          />
          <StatTile
            label="Total roster value"
            value={formatCurrency(insights.totalValue)}
            subtitle={`Across ${insights.playerCount} players`}
            muted={insights.totalValue === 0}
          />
          <StatTile
            label="Avg contract length"
            value={
              insights.avgContractLength == null
                ? '—'
                : insights.avgContractLength.toFixed(1)
            }
            subtitle="Across players with contracts"
            muted={insights.avgContractLength == null}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default RosterInsightsCard;

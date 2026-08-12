import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bot } from 'lucide-react';
import { useAutopilotActivity } from '@/hooks/useAutopilotActivity';
import type { AutopilotActivity } from '@/hooks/useAutopilotActivity';
import { formatCurrency } from '@/utils/csvExport';

interface AutopilotActivityFeedProps {
  leagueId: string;
}

const LABEL: Record<string, string> = {
  automation_waiver_pricing: 'PRICING',
  automation_dead_cap: 'DEAD CAP',
};

/** The salary figure an entry is about, whichever capability wrote it. */
const amountOf = (entry: AutopilotActivity): number | null => {
  const value = entry.metadata?.totalSalary ?? entry.metadata?.totalSalaryCharged;
  return typeof value === 'number' ? value : null;
};

const Row = ({ entry }: { entry: AutopilotActivity }) => {
  const amount = amountOf(entry);
  const playerCount = entry.metadata?.players?.length ?? 0;

  return (
    <div
      className="grid grid-cols-[1fr_auto] items-start gap-3 px-3 py-2.5 border-l-2 border-primary/40"
      style={{ background: 'hsl(var(--card-light) / 0.4)' }}
    >
      <div className="min-w-0">
        <div
          className="font-headline font-bold text-foreground"
          style={{ fontSize: 13, letterSpacing: '0.02em' }}
        >
          {entry.title}
        </div>
        <div
          className="font-mono text-muted-foreground mt-1"
          style={{ fontSize: 10, letterSpacing: '0.1em' }}
        >
          {LABEL[entry.activity_type] ?? 'AUTOPILOT'}
          {amount !== null && ` · ${formatCurrency(amount)}`}
          {playerCount > 1 && ` · ${playerCount} PLAYERS`}
          {' · '}
          {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true }).toUpperCase()}
        </div>
        {entry.description && (
          <p className="text-xs text-muted-foreground mt-1.5">{entry.description}</p>
        )}
      </div>

      <Badge
        variant="outline"
        className="font-mono text-primary border-primary/40 bg-primary/10 flex-shrink-0"
        style={{ fontSize: 9, letterSpacing: '0.1em' }}
      >
        AUTO
      </Badge>
    </div>
  );
};

/**
 * What ran while nobody was watching.
 *
 * Only actual writes appear here. The job sweeps every enabled league every
 * six hours, so recording runs that did nothing would bury the handful of
 * entries that matter — and a feed nobody can skim is a feed nobody reads.
 *
 * This is a pull, not a push: it tells you what happened once you look. Real
 * notification needs an outbound channel, which this app has none of.
 */
export const AutopilotActivityFeed = ({ leagueId }: AutopilotActivityFeedProps) => {
  const { activity, loading, isUnavailable } = useAutopilotActivity(leagueId);

  // Ships with a migration; nothing useful to show before it's applied.
  if (isUnavailable) return null;

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-14" />
        ))}
      </div>
    );
  }

  if (activity.length === 0) {
    return (
      <Alert>
        <Bot className="h-4 w-4" />
        <AlertDescription>
          Nothing written automatically yet. Entries appear here when the scheduled job prices a
          waiver claim or charges dead cap — which it only does for leagues that have switched
          those on in Settings.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {activity.map((entry) => (
        <Row key={entry.id} entry={entry} />
      ))}
    </div>
  );
};

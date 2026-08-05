import { useMemo } from 'react';
import { TurfPanel } from '@/components/ui/turf-panel';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { formatCurrency } from '@/utils/csvExport';
import type {
  ComplianceFinding,
  ComplianceRule,
  RosterCapBreakdown,
} from '@/utils/compliance';

interface ReviewQueuePanelProps {
  findings: ComplianceFinding[];
  converged: boolean;
  anomalies: string[];
  loading: boolean;
}

/**
 * Triage order: the rules that cost a league its integrity come first. A cap
 * breach changes who wins; an IR stash is a nudge.
 */
const RULE_ORDER: ComplianceRule[] = [
  'cap_ceiling',
  'trade_deadline',
  'taxi_eligibility',
  'ir_stash',
];

const RULE_META: Record<ComplianceRule, { label: string; blurb: string }> = {
  cap_ceiling: {
    label: 'Over the Cap',
    blurb: 'Transactions that left a roster above the salary cap.',
  },
  trade_deadline: {
    label: 'After the Deadline',
    blurb: "Trades completed past the league's trade deadline.",
  },
  taxi_eligibility: {
    label: 'Taxi Squad Eligibility',
    blurb: 'Players with too much experience to occupy a taxi slot.',
  },
  ir_stash: {
    label: 'IR Without an Injury',
    blurb:
      'Players on IR with no injury designation. IR salary is excluded from the cap, so this is a way to shelter money — verify before acting, since injury data lags.',
  },
};

const CapMath = ({
  before,
  after,
  salaryCap,
}: {
  before: RosterCapBreakdown | null;
  after: RosterCapBreakdown;
  salaryCap: number;
}) => (
  <div className="font-mono mt-2 space-y-0.5" style={{ fontSize: 10, letterSpacing: '0.05em' }}>
    {before && (
      <div className="text-muted-foreground">
        BEFORE {formatCurrency(before.active)} + {formatCurrency(before.deadCap)} DEAD ={' '}
        {formatCurrency(before.total)}
      </div>
    )}
    <div className="text-muted-foreground">
      AFTER {formatCurrency(after.active)} + {formatCurrency(after.deadCap)} DEAD ={' '}
      <span className="text-secondary font-semibold">{formatCurrency(after.total)}</span>
    </div>
    <div className="text-muted-foreground">CAP {formatCurrency(salaryCap)}</div>
  </div>
);

const FindingRow = ({ finding }: { finding: ComplianceFinding }) => {
  const detail = finding.detail || {};
  const after = detail.after as RosterCapBreakdown | undefined;

  return (
    <div
      className="grid grid-cols-[1fr_auto] items-start gap-3 px-3 py-2.5 border-l-2 border-secondary/40 transition-colors"
      style={{ background: 'hsl(var(--card-light) / 0.4)' }}
    >
      <div className="min-w-0">
        <div
          className="font-headline font-bold text-foreground"
          style={{ fontSize: 13, letterSpacing: '0.02em' }}
        >
          {finding.summary}
        </div>

        {/* The arithmetic, always visible. A finding the commissioner can't
            check independently is a finding they won't act on. */}
        {after && (
          <CapMath
            before={(detail.before as RosterCapBreakdown | null) ?? null}
            after={after}
            salaryCap={Number(detail.salaryCap) || 0}
          />
        )}

        {finding.rule === 'taxi_eligibility' && (
          <div
            className="font-mono text-muted-foreground mt-1"
            style={{ fontSize: 10, letterSpacing: '0.1em' }}
          >
            {String(detail.yearsExp)} YRS EXP · LIMIT {String(detail.maxYears)}
          </div>
        )}

        {finding.rule === 'ir_stash' && (
          <div
            className="font-mono text-muted-foreground mt-1"
            style={{ fontSize: 10, letterSpacing: '0.1em' }}
          >
            SHELTERED {formatCurrency(Number(detail.shelteredSalary) || 0)} · STATUS{' '}
            {String(detail.injuryStatus ?? 'NONE').toUpperCase()}
          </div>
        )}

        {finding.rule === 'trade_deadline' && (
          <div
            className="font-mono text-muted-foreground mt-1"
            style={{ fontSize: 10, letterSpacing: '0.1em' }}
          >
            WEEK {String(detail.week)} · DEADLINE WEEK {String(detail.deadline)}
          </div>
        )}
      </div>

      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <Badge
          variant="outline"
          className={
            finding.severity === 'violation'
              ? 'font-mono text-secondary border-secondary/40 bg-secondary/10'
              : 'font-mono text-muted-foreground border-border'
          }
          style={{ fontSize: 9, letterSpacing: '0.1em' }}
        >
          {finding.severity === 'violation' ? 'VIOLATION' : 'REVIEW'}
        </Badge>
        {finding.week !== undefined && (
          <span
            className="font-mono text-muted-foreground"
            style={{ fontSize: 9, letterSpacing: '0.1em' }}
          >
            WK {finding.week}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * The commissioner's exception list.
 *
 * Nothing here has an action button, and that is the design rather than an
 * omission: Sleeper's API is read-only, so this app cannot reverse a trade or
 * undo a signing. What it can do is notice, show the math, and say which
 * roster and which week — the commissioner acts in Sleeper. Presenting a
 * "Reject" button that silently did nothing in Sleeper would be worse than
 * presenting none.
 */
export const ReviewQueuePanel = ({
  findings,
  converged,
  anomalies,
  loading,
}: ReviewQueuePanelProps) => {
  const grouped = useMemo(() => {
    const byRule = new Map<ComplianceRule, ComplianceFinding[]>();
    findings.forEach((finding) => {
      const existing = byRule.get(finding.rule);
      if (existing) existing.push(finding);
      else byRule.set(finding.rule, [finding]);
    });
    return RULE_ORDER.filter((rule) => byRule.has(rule)).map((rule) => ({
      rule,
      findings: byRule.get(rule)!,
    }));
  }, [findings]);

  const defaultOpen = useMemo(() => grouped.map((group) => group.rule), [grouped]);
  const violationCount = findings.filter((f) => f.severity === 'violation').length;

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-20" />
        ))}
      </div>
    );
  }

  return (
    <TurfPanel
      kicker={`COMPLIANCE / NEEDS REVIEW · ${findings.length}`}
      title="Rule Exceptions"
      action={
        violationCount > 0 ? (
          <Badge
            variant="outline"
            className="font-mono text-secondary border-secondary/40 bg-secondary/10"
            style={{ fontSize: 10, letterSpacing: '0.1em' }}
          >
            {violationCount} {violationCount === 1 ? 'VIOLATION' : 'VIOLATIONS'}
          </Badge>
        ) : null
      }
    >
      {!converged && (
        <Alert className="mb-4 border-amber-500/50 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <span className="font-medium">Roster history is incomplete.</span> Sleeper's
            transaction log doesn't account for the current rosters, which usually means rosters
            were edited directly in Sleeper. Cap and trade-deadline checks are hidden rather than
            reported from history that can't be trusted.
            {anomalies.length > 0 && (
              <span
                className="block font-mono text-muted-foreground mt-2"
                style={{ fontSize: 10 }}
              >
                {anomalies[0]}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {findings.length === 0 ? (
        <Alert className="border-emerald-500/30 bg-emerald-500/5">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <AlertDescription>
            No rule exceptions. Every transaction this season kept its roster within the cap and
            inside the league's roster rules.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              These are flagged for your judgement, not acted on. Sleeper's API is read-only, so
              reversing a trade or a signing has to happen in Sleeper.
            </AlertDescription>
          </Alert>

          <Accordion type="multiple" defaultValue={defaultOpen}>
            {grouped.map((group) => (
              <AccordionItem key={group.rule} value={group.rule}>
                <AccordionTrigger>
                  <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                    <span
                      className="font-headline font-bold uppercase text-foreground truncate"
                      style={{ fontSize: 13, letterSpacing: '0.05em' }}
                    >
                      {RULE_META[group.rule].label}
                    </span>
                    <Badge
                      variant="outline"
                      className="font-mono text-secondary border-secondary/40 bg-secondary/10 flex-shrink-0"
                      style={{ fontSize: 10, letterSpacing: '0.1em' }}
                    >
                      {group.findings.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <p
                    className="font-mono text-muted-foreground mb-3"
                    style={{ fontSize: 10, letterSpacing: '0.05em' }}
                  >
                    {RULE_META[group.rule].blurb}
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {group.findings.map((finding) => (
                      <FindingRow key={finding.id} finding={finding} />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </>
      )}
    </TurfPanel>
  );
};

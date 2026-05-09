import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Crown, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCommissionerActions } from '@/hooks/useCommissionerActions';
import { useReadOnly } from '@/contexts/read-only-context';
import { formatCurrency } from '@/utils/csvExport';

export type OverrideKind = 'retain' | 'franchise' | 'manual';

export interface OverrideTarget {
  playerId: string;
  playerName: string;
  rosterId: number;
  teamName: string;
  currentSalary: number;
  currentContractLength: number;
}

interface ManualContractOverrideDialogProps {
  leagueId: string;
  target: OverrideTarget;
  kind: OverrideKind;
  onClose: () => void;
}

const KIND_META: Record<
  OverrideKind,
  { title: string; subtitle: string; defaultLength: number; salaryHint: string; Icon: typeof Crown }
> = {
  retain: {
    title: 'Retain Player',
    subtitle: 'Manually extend an expiring contract.',
    defaultLength: 2,
    salaryHint: 'Negotiated retention salary.',
    Icon: RefreshCw,
  },
  franchise: {
    title: 'Apply Franchise Tag',
    subtitle: '1-year exclusive tag at a premium salary.',
    defaultLength: 1,
    salaryHint: 'Set the franchise tag salary per your league rules.',
    Icon: Crown,
  },
  manual: {
    title: 'Manual Contract Override',
    subtitle: 'Direct edit. Used when the system is wrong.',
    defaultLength: 1,
    salaryHint: 'New base salary for this player.',
    Icon: AlertTriangle,
  },
};

export const ManualContractOverrideDialog = ({
  leagueId,
  target,
  kind,
  onClose,
}: ManualContractOverrideDialogProps) => {
  const { readOnly } = useReadOnly();
  const meta = KIND_META[kind];
  const { toast } = useToast();
  const { logAction } = useCommissionerActions(leagueId);
  const [contractLength, setContractLength] = useState<number>(meta.defaultLength);
  const [salary, setSalary] = useState<number>(
    kind === 'franchise'
      ? Math.max(target.currentSalary, Math.round(target.currentSalary * 1.2))
      : target.currentSalary,
  );
  const [reason, setReason] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Reset whenever kind/target changes (rare given dialog lifecycle, but safe)
  useEffect(() => {
    setContractLength(meta.defaultLength);
    setSalary(
      kind === 'franchise'
        ? Math.max(target.currentSalary, Math.round(target.currentSalary * 1.2))
        : target.currentSalary,
    );
    setReason('');
  }, [kind, target, meta.defaultLength]);

  const submit = async () => {
    if (readOnly) return; // belt-and-suspenders; UI shouldn't expose the dialog when readOnly
    if (!Number.isFinite(contractLength) || contractLength < 0 || contractLength > 10) {
      toast({
        title: 'Invalid contract length',
        description: 'Contract length must be 0–10 years.',
        variant: 'destructive',
      });
      return;
    }
    if (!Number.isFinite(salary) || salary < 0) {
      toast({
        title: 'Invalid salary',
        description: 'Salary must be a non-negative number.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const previous = {
        contract_length: target.currentContractLength,
        salary: target.currentSalary,
      };

      // 1. Upsert contract
      const { error: contractErr } = await supabase
        .from('player_contracts')
        .upsert(
          {
            league_id: leagueId,
            player_id: target.playerId,
            contract_length: contractLength,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'league_id,player_id' },
        );
      if (contractErr) throw contractErr;

      // 2. Upsert salary (preserve existing taxi/acquisition where possible by
      // selecting first; fall back to defaults).
      const { data: existing } = await supabase
        .from('player_salaries')
        .select('taxi_squad, acquisition_type')
        .eq('league_id', leagueId)
        .eq('player_id', target.playerId)
        .maybeSingle();

      const { error: salaryErr } = await supabase
        .from('player_salaries')
        .upsert(
          {
            league_id: leagueId,
            player_id: target.playerId,
            salary,
            taxi_squad: existing?.taxi_squad ?? false,
            acquisition_type: existing?.acquisition_type ?? 'contract',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'league_id,player_id' },
        );
      if (salaryErr) throw salaryErr;

      // 3. Audit log
      const action_type =
        kind === 'retain'
          ? 'contract_retain'
          : kind === 'franchise'
            ? 'contract_franchise'
            : 'contract_manual_override';
      const description =
        kind === 'retain'
          ? `Retained ${target.playerName} on Team ${target.teamName} (${contractLength}yr / ${formatCurrency(salary)})`
          : kind === 'franchise'
            ? `Franchise-tagged ${target.playerName} on Team ${target.teamName} (1yr / ${formatCurrency(salary)})`
            : `Manual contract override on ${target.playerName} (${contractLength}yr / ${formatCurrency(salary)})`;

      await logAction({
        action_type,
        target_type: 'player_contract',
        target_id: target.playerId,
        description,
        metadata: {
          roster_id: target.rosterId,
          team_name: target.teamName,
          previous,
          next: { contract_length: contractLength, salary },
          kind,
          reason: reason.trim() || null,
        },
      });

      toast({
        title: 'Override applied',
        description,
      });
      onClose();
    } catch (err) {
      console.error('Override failed:', err);
      toast({
        title: 'Override failed',
        description: err instanceof Error ? err.message : 'Could not apply override.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const Icon = meta.Icon;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-primary" />
            {meta.title}
          </DialogTitle>
          <DialogDescription>{meta.subtitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div
            className="rounded border border-border p-3"
            style={{ background: 'hsl(var(--card-light) / 0.4)' }}
          >
            <div className="font-headline font-bold text-foreground" style={{ fontSize: 14 }}>
              {target.playerName}
            </div>
            <div className="font-mono text-muted-foreground mt-0.5" style={{ fontSize: 10, letterSpacing: '0.1em' }}>
              {target.teamName.toUpperCase()} · CURRENT {formatCurrency(target.currentSalary)} · {target.currentContractLength}yr LEFT
            </div>
            <div className="mt-2 flex gap-1">
              <Badge variant="outline" className="font-mono" style={{ fontSize: 9, letterSpacing: '0.1em' }}>
                {kind.toUpperCase()}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="override-length">Contract length (years)</Label>
              <Input
                id="override-length"
                type="number"
                min={0}
                max={10}
                step={1}
                value={contractLength}
                onChange={(e) => setContractLength(Number(e.target.value))}
                disabled={kind === 'franchise'}
              />
              {kind === 'franchise' && (
                <p className="text-xs text-muted-foreground">Franchise tag is fixed at 1 year.</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="override-salary">New salary</Label>
              <Input
                id="override-salary"
                type="number"
                min={0}
                step={1}
                value={salary}
                onChange={(e) => setSalary(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">{meta.salaryHint}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="override-reason">Reason (optional)</Label>
            <Textarea
              id="override-reason"
              rows={2}
              placeholder="e.g. Sleeper missed the auto-extension; applying retention manually."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This writes to the live league and is recorded in the commissioner audit log.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving || readOnly}>
            {saving ? 'Saving…' : `Apply ${meta.title}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

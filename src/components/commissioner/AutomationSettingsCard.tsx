import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Bot, OctagonX, Play } from 'lucide-react';
import { useLeagueAutomation } from '@/hooks/useLeagueAutomation';
import { useReadOnly } from '@/contexts/read-only-context';
import { useCommissionerActions } from '@/hooks/useCommissionerActions';
import { useToast } from '@/hooks/use-toast';

interface AutomationSettingsCardProps {
  leagueId: string;
}

/**
 * Consent and an emergency stop for background writes.
 *
 * The scheduled waiver job used to select its work from league ownership
 * alone, so claiming a league silently enrolled it in having a job write to
 * the salary table. This is where that becomes a decision instead.
 */
export const AutomationSettingsCard = ({ leagueId }: AutomationSettingsCardProps) => {
  const { automation, isPaused, loading, saving, isUnavailable, update, pause, resume } =
    useLeagueAutomation(leagueId);
  const { readOnly } = useReadOnly();
  const { logAction } = useCommissionerActions(leagueId);
  const { toast } = useToast();

  if (loading) {
    return <Skeleton className="h-56 w-full" />;
  }

  // The feature ships with a migration; if it hasn't been applied there is
  // nothing to configure and a broken-looking card helps nobody.
  if (isUnavailable) {
    return null;
  }

  const disabled = readOnly || saving;

  const handleToggle = async (
    capability: 'auto_waiver_pricing' | 'auto_dead_cap',
    enabled: boolean,
    copy: { label: string; on: string; off: string },
  ) => {
    const ok = await update({ [capability]: enabled });
    if (!ok) return;
    void logAction({
      action_type: enabled ? 'automation_enabled' : 'automation_disabled',
      target_type: 'league_automation_settings',
      description: `${enabled ? 'Enabled' : 'Disabled'} ${copy.label}`,
      metadata: { capability, enabled, surface: 'settings-panel' },
    });
    toast({
      title: enabled ? `${copy.label} on` : `${copy.label} off`,
      description: enabled ? copy.on : copy.off,
    });
  };

  const handlePauseToggle = async () => {
    const ok = isPaused ? await resume() : await pause('Paused from the commissioner dashboard');
    if (!ok) return;
    void logAction({
      action_type: isPaused ? 'automation_resumed' : 'automation_paused',
      target_type: 'league_automation_settings',
      description: isPaused ? 'Resumed league automation' : 'Paused all league automation',
      metadata: { surface: 'settings-panel' },
    });
    toast({
      title: isPaused ? 'Automation resumed' : 'Automation paused',
      description: isPaused
        ? 'Enabled capabilities will run again on the next scheduled pass.'
        : 'Nothing will write to this league until you resume, whatever else is switched on.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              Automation
            </CardTitle>
            <CardDescription>
              What this app is allowed to do to your league without anyone watching
            </CardDescription>
          </div>
          {isPaused && (
            <Badge
              variant="outline"
              className="font-mono text-secondary border-secondary/40 bg-secondary/10 flex-shrink-0"
              style={{ fontSize: 10, letterSpacing: '0.1em' }}
            >
              PAUSED
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isPaused && (
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <OctagonX className="h-4 w-4" />
            <AlertDescription>
              All automation is stopped for this league. Individual settings below are kept as
              they are, so resuming picks up exactly where you left off.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="auto_waiver_pricing">Price waiver claims automatically</Label>
            <p className="text-xs text-muted-foreground">
              Waiver pickups are priced from their FAAB bid. Without this, that only happens
              while a commissioner has the app open — so between Wednesday's waivers and your
              next visit, every manager's cap figure is short.
            </p>
          </div>
          <Switch
            id="auto_waiver_pricing"
            checked={automation.auto_waiver_pricing}
            onCheckedChange={(next) =>
              handleToggle('auto_waiver_pricing', next, {
                label: 'automated waiver pricing',
                on: 'Waiver claims will be priced from their FAAB bid without anyone opening the app.',
                off: 'Waiver claims will only be priced while a commissioner has the app open.',
              })
            }
            disabled={disabled || isPaused}
          />
        </div>

        <Separator />

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="auto_dead_cap">Charge dead cap on drops</Label>
            <p className="text-xs text-muted-foreground">
              When a player carrying a salary is released, record the dead cap penalty
              automatically. Trades are not releases and are never charged. Players acquired
              with FAAB are skipped — they cost nothing against the cap while rostered, so
              releasing them costs nothing. Entries appear in the Dead Cap manager; removing one
              there is permanent, and automation will not add it back.
            </p>
          </div>
          <Switch
            id="auto_dead_cap"
            checked={automation.auto_dead_cap}
            onCheckedChange={(next) =>
              handleToggle('auto_dead_cap', next, {
                label: 'automated dead cap',
                on: 'Dropped players carrying a salary will be charged dead cap automatically.',
                off: 'Dead cap will only be recorded when a commissioner adds it by hand.',
              })
            }
            disabled={disabled || isPaused}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label>{isPaused ? 'Resume automation' : 'Stop all automation'}</Label>
            <p className="text-xs text-muted-foreground">
              {isPaused
                ? 'Let enabled capabilities run again.'
                : 'One switch that halts everything for this league, whatever is enabled above.'}
            </p>
          </div>
          <Button
            variant={isPaused ? 'default' : 'outline'}
            size="sm"
            onClick={handlePauseToggle}
            disabled={disabled}
            className="flex-shrink-0"
          >
            {isPaused ? (
              <>
                <Play className="h-4 w-4 mr-1.5" />
                Resume
              </>
            ) : (
              <>
                <OctagonX className="h-4 w-4 mr-1.5" />
                Pause all
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useLeagueSettings } from '@/hooks/useLeagueSettings';
import { useCommissionerActions } from '@/hooks/useCommissionerActions';
import { useToast } from '@/hooks/use-toast';
import { Save, Settings } from 'lucide-react';

interface LeagueConfigurationPanelProps {
  leagueId: string;
  leagueData: any;
}

export const LeagueConfigurationPanel = ({ leagueId, leagueData }: LeagueConfigurationPanelProps) => {
  const { settings, updateSettings, loading } = useLeagueSettings(leagueId);
  const { logAction } = useCommissionerActions(leagueId);
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    salary_cap: settings?.salary_cap || 200000,
    faab_cap: settings?.faab_cap || 100,
    reserve_limit: settings?.reserve_limit || 100,
    dead_cap_enabled: settings?.dead_cap_enabled ?? true,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const success = await updateSettings(formData);
      if (success) {
        await logAction({
          action_type: 'settings_update',
          target_type: 'league_settings',
          description: 'Updated league configuration settings',
          metadata: { 
            changes: formData,
            previous: settings 
          }
        });
        toast({
          title: "Settings Updated",
          description: "League configuration has been saved successfully.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return <div className="text-center py-8">Loading league settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-5 w-5 text-primary" />
        <div>
          <h2 className="text-xl font-semibold">League Configuration</h2>
          <p className="text-sm text-muted-foreground">
            Manage salary caps, FAAB budgets, and other league settings
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Financial Settings</CardTitle>
          <CardDescription>
            Configure salary cap and FAAB budget limits for your league
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salary_cap">Salary Cap</Label>
              <Input
                id="salary_cap"
                type="number"
                value={formData.salary_cap}
                onChange={(e) => handleInputChange('salary_cap', Number(e.target.value))}
                placeholder="200000"
              />
              <p className="text-xs text-muted-foreground">
                Total salary budget per team
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="faab_cap">FAAB Budget</Label>
              <Input
                id="faab_cap"
                type="number"
                value={formData.faab_cap}
                onChange={(e) => handleInputChange('faab_cap', Number(e.target.value))}
                placeholder="100"
              />
              <p className="text-xs text-muted-foreground">
                Free Agent Acquisition Budget per team
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reserve_limit">Reserve Limit</Label>
              <Input
                id="reserve_limit"
                type="number"
                value={formData.reserve_limit}
                onChange={(e) => handleInputChange('reserve_limit', Number(e.target.value))}
                placeholder="100"
              />
              <p className="text-xs text-muted-foreground">
                Maximum reserve budget per team
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dead_cap_enabled">Dead Cap Enabled</Label>
                <p className="text-xs text-muted-foreground">
                  Enable dead cap penalties for released players
                </p>
              </div>
              <Switch
                id="dead_cap_enabled"
                checked={formData.dead_cap_enabled}
                onCheckedChange={(checked) => handleInputChange('dead_cap_enabled', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>League Information</CardTitle>
          <CardDescription>
            Basic league details and status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>League Name</Label>
              <Input value={leagueData?.name || 'Unknown League'} disabled />
            </div>
            <div className="space-y-2">
              <Label>Season</Label>
              <Input value={leagueData?.season || '2024'} disabled />
            </div>
            <div className="space-y-2">
              <Label>Sport</Label>
              <Input value={leagueData?.sport || 'NFL'} disabled />
            </div>
            <div className="space-y-2">
              <Label>Total Teams</Label>
              <Input value={leagueData?.total_rosters || 0} disabled />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            League information is synced from Sleeper and cannot be modified here
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};
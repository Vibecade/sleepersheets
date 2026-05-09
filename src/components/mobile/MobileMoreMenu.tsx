import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Download, Info, HelpCircle, FileText, Calendar, LogOut, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MinimizablePendingFreeAgents from '@/components/MinimizablePendingFreeAgents';
import { usePlayerSalaries } from '@/hooks/usePlayerSalaries';
import { useLeagueSettings } from '@/hooks/useLeagueSettings';
import { useDeadCapPlayers } from '@/hooks/useDeadCapPlayers';
import { calculateOptimizedSalaries } from '@/utils/salaryCalculations';
import { normalizeUsersToMap } from '@/utils/leagueDataUtils';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import type { CommissionerLeagueData } from '@/types/sleeper';

interface MobileMoreMenuProps {
  leagueId: string;
  leagueData: CommissionerLeagueData;
  isCommissioner: boolean;
  onNavigateToCommissioner: () => void;
}

export const MobileMoreMenu: React.FC<MobileMoreMenuProps> = ({
  leagueId,
  leagueData,
  isCommissioner,
  onNavigateToCommissioner,
}) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [showFreeAgents, setShowFreeAgents] = useState(false);

  // The desktop view has UserMenu in PageNavigation; on mobile the only nav
  // surface in-league is this menu, so the sign-out lives here.
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
      toast({ title: 'Signed Out', description: 'You have been successfully signed out' });
    } catch {
      toast({ title: 'Error', description: 'Failed to sign out', variant: 'destructive' });
    }
  };

  // The pending-free-agents modal needs salary + cap data that the
  // parent's `leagueDataForExport` doesn't carry. Pull it locally so the
  // modal actually populates instead of rendering empty (the previous
  // shape mismatch — `leagueData?.salaries` etc. — was always undefined).
  // Memoize the rosters array so the `||` fallback doesn't churn the
  // dep array on every render.
  const rosters = useMemo(
    () => leagueData?.rosters || [],
    [leagueData?.rosters]
  );
  const userMap = useMemo(
    () => normalizeUsersToMap(leagueData?.users),
    [leagueData?.users]
  );
  const { salaries, getSalaryCapContribution, loading: salariesLoading } =
    usePlayerSalaries(leagueId);
  const { settings } = useLeagueSettings(leagueId);
  const { deadCapPlayers, loading: deadCapLoading } = useDeadCapPlayers(leagueId);
  const salaryCap = settings?.salary_cap || 200000;

  const teamSalaries = useMemo(() => {
    if (!rosters.length || salariesLoading || deadCapLoading) return {};
    return calculateOptimizedSalaries({
      rosters,
      deadCapPlayers,
      getSalaryCapContribution,
      salaryCap,
    }).teamSalaries;
  }, [rosters, deadCapPlayers, getSalaryCapContribution, salaryCap, salariesLoading, deadCapLoading]);

  return (
    <div className="space-y-4 pb-20">
      <div className="rounded-xl border border-white/10 bg-black/25 backdrop-blur-sm px-4 py-3">
        <h2 className="text-2xl font-bold text-foreground">More Options</h2>
        <p className="text-sm text-muted-foreground">Quick actions and league tools, optimized for mobile.</p>
      </div>

      {/* Free Agents / Expiring Contracts */}
      <Card className="border-border/50 bg-card/70 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Free Agents</CardTitle>
          </div>
          <CardDescription>
            View players with expiring contracts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => setShowFreeAgents(true)}
            variant="outline"
            className="w-full"
          >
            <Calendar className="h-4 w-4 mr-2" />
            View Expiring Contracts
          </Button>
        </CardContent>
      </Card>

      {showFreeAgents && (
        <MinimizablePendingFreeAgents
          open={showFreeAgents}
          onOpenChange={setShowFreeAgents}
          leagueId={leagueId}
          rosters={rosters}
          userMap={userMap}
          players={leagueData?.players || {}}
          salaries={salaries}
          salaryCap={salaryCap}
          teamSalaries={teamSalaries}
        />
      )}

      {/* Commissioner Dashboard - Only show if user is commissioner */}
      {isCommissioner && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>Commissioner Dashboard</CardTitle>
            </div>
            <CardDescription>
              Manage league settings, users, and transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={onNavigateToCommissioner}
              className="w-full"
              size="lg"
            >
              <Shield className="h-4 w-4 mr-2" />
              Open Dashboard
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Export Data */}
      <Card className="border-border/50 bg-card/70 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Export Data</CardTitle>
          </div>
          <CardDescription>
            Download league data as CSV files
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => navigate('/export', { state: { leagueData } })}
            variant="outline"
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Options
          </Button>
        </CardContent>
      </Card>

      {/* Help & Resources */}
      <Card className="border-border/50 bg-card/70 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Help & Resources</CardTitle>
          </div>
          <CardDescription>
            Learn how to use SleeperSheets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button 
            onClick={() => navigate('/how-to')}
            variant="outline"
            className="w-full justify-start"
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            How-to Guide
          </Button>
          <Button 
            onClick={() => navigate('/about')}
            variant="outline"
            className="w-full justify-start"
          >
            <Info className="h-4 w-4 mr-2" />
            About SleeperSheets
          </Button>
        </CardContent>
      </Card>

      {/* Account */}
      <Card className="border-border/50 bg-card/70 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Account</CardTitle>
          </div>
          <CardDescription>
            {user
              ? user.email
                ? `Signed in as ${user.email}`
                : 'Manage your sign-in session'
              : 'Sign in to claim leagues and persist preferences'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {user ? (
            <Button
              onClick={() => void handleSignOut()}
              variant="outline"
              className="w-full justify-start text-red-400 hover:text-red-300"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          ) : (
            <Button
              onClick={() => navigate('/auth')}
              variant="outline"
              className="w-full justify-start"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Legal */}
      <Card className="border-border/50 bg-card/70 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Legal & Privacy</CardTitle>
          </div>
          <CardDescription>
            Terms, privacy policy, and cookies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button 
            onClick={() => navigate('/terms')}
            variant="ghost"
            className="w-full justify-start"
            size="sm"
          >
            Terms of Service
          </Button>
          <Button 
            onClick={() => navigate('/privacy')}
            variant="ghost"
            className="w-full justify-start"
            size="sm"
          >
            Privacy Policy
          </Button>
          <Button 
            onClick={() => navigate('/cookies')}
            variant="ghost"
            className="w-full justify-start"
            size="sm"
          >
            Cookie Policy
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Download, Info, HelpCircle, FileText, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MinimizablePendingFreeAgents from '@/components/MinimizablePendingFreeAgents';

interface MobileMoreMenuProps {
  leagueId: string;
  leagueData: any;
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
  const [showFreeAgents, setShowFreeAgents] = useState(false);

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
          rosters={leagueData?.rosters || []}
          userMap={leagueData?.userMap || {}}
          players={leagueData?.players || {}}
          salaries={leagueData?.salaries || {}}
          salaryCap={leagueData?.salaryCap || 500}
          teamSalaries={leagueData?.teamSalaries || {}}
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

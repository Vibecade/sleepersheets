import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Download, Info, HelpCircle, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

  return (
    <div className="space-y-4 pb-20">
      <h2 className="text-2xl font-bold text-foreground">More Options</h2>

      {/* Commissioner Dashboard - Only show if user is commissioner */}
      {isCommissioner && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
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
      <Card>
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
      <Card>
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
      <Card>
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

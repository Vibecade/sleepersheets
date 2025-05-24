
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExportInfoProps {
  onRefreshSalaries?: () => Promise<void>;
  refreshing?: boolean;
}

const ExportInfo: React.FC<ExportInfoProps> = ({ onRefreshSalaries, refreshing = false }) => {
  const { toast } = useToast();

  const handleRefresh = async () => {
    if (onRefreshSalaries) {
      try {
        await onRefreshSalaries();
        toast({
          title: "Salaries Refreshed",
          description: "All salary data has been reloaded from the database"
        });
      } catch (error) {
        toast({
          title: "Refresh Failed",
          description: "Failed to refresh salary data",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <Card className="glass border-blue-400/30">
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4">
          <Alert className="border-blue-400/30 bg-blue-500/10">
            <Info className="h-4 w-4 text-blue-400 flex-shrink-0" />
            <AlertDescription className="text-blue-200 text-sm">
              <strong>About Clean Exports:</strong> These CSV files are optimized for Google Sheets and Excel with normalized headers, 
              proper formatting, and include fantasy salary data when available.
            </AlertDescription>
          </Alert>

          <Alert className="border-amber-400/30 bg-amber-500/10">
            <RefreshCw className="h-4 w-4 text-amber-400 flex-shrink-0" />
            <AlertDescription className="text-amber-200 text-sm">
              <strong>Salary Data:</strong> Fantasy salary information is loaded when you first access the league. 
              If you've recently updated salaries in the dashboard, click refresh below to ensure the latest data is included in exports.
            </AlertDescription>
          </Alert>

          {onRefreshSalaries && (
            <div className="flex justify-center pt-2">
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2 text-sm"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh Salary Data'}</span>
                <span className="sm:hidden">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExportInfo;

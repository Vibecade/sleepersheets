
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { WifiOff, Wifi, RefreshCw, Clock } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useIsMobile } from '@/hooks/use-mobile';

const OfflineIndicator: React.FC = () => {
  const { isOnline } = usePWA();
  const { pendingSync, lastSyncTime, syncPendingData } = useOfflineSync();
  const isMobile = useIsMobile();

  const formatLastSync = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  if (isOnline && pendingSync === 0) {
    return null;
  }

  return (
    <div className="space-y-2 mb-4">
      {!isOnline && (
        <Alert className="border-amber-200 bg-amber-50">
          <WifiOff className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between space-y-2 xs:space-y-0">
              <span>You're offline. Changes will sync when reconnected.</span>
              {lastSyncTime && !isMobile && (
                <span className="text-xs opacity-75">
                  Last sync: {formatLastSync(lastSyncTime)}
                </span>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {isOnline && pendingSync > 0 && (
        <Alert className="border-blue-200 bg-blue-50">
          <RefreshCw className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between space-y-2 xs:space-y-0">
              <span>{pendingSync} changes pending sync</span>
              <Button
                variant="outline"
                size={isMobile ? "sm" : "xs"}
                onClick={syncPendingData}
                className="xs:w-auto w-full touch-manipulation"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Sync Now
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default OfflineIndicator;

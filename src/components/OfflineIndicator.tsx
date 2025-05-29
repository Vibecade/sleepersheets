
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff, Wifi } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

const OfflineIndicator: React.FC = () => {
  const { isOnline } = usePWA();

  if (isOnline) {
    return null;
  }

  return (
    <Alert className="border-amber-200 bg-amber-50 mb-4">
      <WifiOff className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-800">
        You're currently offline. Some features may not be available until you reconnect.
      </AlertDescription>
    </Alert>
  );
};

export default OfflineIndicator;

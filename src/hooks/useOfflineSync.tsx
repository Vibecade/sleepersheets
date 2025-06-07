
import { useState, useEffect } from 'react';
import { usePWA } from './usePWA';

interface OfflineData {
  timestamp: number;
  data: any;
  type: string;
}

export const useOfflineSync = () => {
  const { isOnline } = usePWA();
  const [pendingSync, setPendingSync] = useState<OfflineData[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

  // Load pending sync data from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('sleepersheets-pending-sync');
    if (stored) {
      try {
        setPendingSync(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading pending sync data:', error);
        localStorage.removeItem('sleepersheets-pending-sync');
      }
    }

    const lastSync = localStorage.getItem('sleepersheets-last-sync');
    if (lastSync) {
      setLastSyncTime(parseInt(lastSync));
    }
  }, []);

  // Save data for offline sync
  const saveForOfflineSync = (data: any, type: string) => {
    const offlineData: OfflineData = {
      timestamp: Date.now(),
      data,
      type,
    };

    const updated = [...pendingSync, offlineData];
    setPendingSync(updated);
    localStorage.setItem('sleepersheets-pending-sync', JSON.stringify(updated));
  };

  // Sync pending data when online
  const syncPendingData = async () => {
    if (!isOnline || pendingSync.length === 0) return;

    try {
      // Process each pending sync item
      for (const item of pendingSync) {
        // Here you would implement the actual sync logic
        // For now, we'll just log it
        console.log('Syncing offline data:', item);
      }

      // Clear pending sync data
      setPendingSync([]);
      localStorage.removeItem('sleepersheets-pending-sync');
      
      // Update last sync time
      const now = Date.now();
      setLastSyncTime(now);
      localStorage.setItem('sleepersheets-last-sync', now.toString());
    } catch (error) {
      console.error('Error syncing offline data:', error);
    }
  };

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingSync.length > 0) {
      syncPendingData();
    }
  }, [isOnline, pendingSync.length]);

  const clearPendingSync = () => {
    setPendingSync([]);
    localStorage.removeItem('sleepersheets-pending-sync');
  };

  return {
    isOnline,
    pendingSync: pendingSync.length,
    lastSyncTime,
    saveForOfflineSync,
    syncPendingData,
    clearPendingSync,
  };
};

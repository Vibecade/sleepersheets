
import { useState, useEffect } from 'react';
import { usePWA } from './usePWA';

interface OfflineData {
  timestamp: number;
  data: any;
  type: string;
  leagueId?: string;
  priority?: 'high' | 'medium' | 'low';
}

export const useOfflineSync = (leagueId?: string) => {
  const { isOnline } = usePWA();
  const [pendingSync, setPendingSync] = useState<OfflineData[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [syncInProgress, setSyncInProgress] = useState(false);

  // Load pending sync data from localStorage on mount (league-specific)
  useEffect(() => {
    const syncKey = leagueId ? `sleepersheets-pending-sync-${leagueId}` : 'sleepersheets-pending-sync';
    const lastSyncKey = leagueId ? `sleepersheets-last-sync-${leagueId}` : 'sleepersheets-last-sync';
    
    const stored = localStorage.getItem(syncKey);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        // Filter by league if needed
        const filtered = leagueId ? data.filter((item: OfflineData) => 
          !item.leagueId || item.leagueId === leagueId
        ) : data;
        setPendingSync(filtered);
      } catch (error) {
        console.error('Error loading pending sync data:', error);
        localStorage.removeItem(syncKey);
      }
    }

    const lastSync = localStorage.getItem(lastSyncKey);
    if (lastSync) {
      setLastSyncTime(parseInt(lastSync));
    }
  }, [leagueId]);

  // Save data for offline sync with league-specific storage
  const saveForOfflineSync = (data: any, type: string, priority: 'high' | 'medium' | 'low' = 'medium') => {
    const offlineData: OfflineData = {
      timestamp: Date.now(),
      data,
      type,
      leagueId,
      priority,
    };

    const updated = [...pendingSync, offlineData];
    setPendingSync(updated);
    
    const syncKey = leagueId ? `sleepersheets-pending-sync-${leagueId}` : 'sleepersheets-pending-sync';
    localStorage.setItem(syncKey, JSON.stringify(updated));
  };

  // Sync pending data when online with priority-based processing
  const syncPendingData = async () => {
    if (!isOnline || pendingSync.length === 0 || syncInProgress) return;

    setSyncInProgress(true);
    try {
      // Sort by priority and timestamp
      const sortedItems = [...pendingSync].sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const aPriority = priorityOrder[a.priority || 'medium'];
        const bPriority = priorityOrder[b.priority || 'medium'];
        
        if (aPriority !== bPriority) return aPriority - bPriority;
        return a.timestamp - b.timestamp;
      });

      // Process each pending sync item with retry logic
      const failed: OfflineData[] = [];
      for (const item of sortedItems) {
        try {
          console.log('Syncing offline data:', item);
          // Here you would implement the actual sync logic based on type
          // For now, we'll simulate the sync
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error('Failed to sync item:', error);
          failed.push(item);
        }
      }

      // Update sync data
      setPendingSync(failed);
      const syncKey = leagueId ? `sleepersheets-pending-sync-${leagueId}` : 'sleepersheets-pending-sync';
      
      if (failed.length > 0) {
        localStorage.setItem(syncKey, JSON.stringify(failed));
      } else {
        localStorage.removeItem(syncKey);
      }
      
      // Update last sync time
      const now = Date.now();
      setLastSyncTime(now);
      const lastSyncKey = leagueId ? `sleepersheets-last-sync-${leagueId}` : 'sleepersheets-last-sync';
      localStorage.setItem(lastSyncKey, now.toString());
    } catch (error) {
      console.error('Error syncing offline data:', error);
    } finally {
      setSyncInProgress(false);
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
    const syncKey = leagueId ? `sleepersheets-pending-sync-${leagueId}` : 'sleepersheets-pending-sync';
    localStorage.removeItem(syncKey);
  };

  // Get sync status for specific league
  const getSyncStatus = () => ({
    pending: pendingSync.length,
    lastSync: lastSyncTime,
    inProgress: syncInProgress,
    leagueId,
  });

  return {
    isOnline,
    pendingSync: pendingSync.length,
    lastSyncTime,
    syncInProgress,
    saveForOfflineSync,
    syncPendingData,
    clearPendingSync,
    getSyncStatus,
  };
};

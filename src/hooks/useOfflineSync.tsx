import { useState, useEffect } from 'react';
import { usePWA } from './usePWA';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface OfflineData {
  timestamp: number;
  data: any;
  type: string;
  id?: string;
  table?: string;
  primaryKey?: Record<string, any>;
}

export const useOfflineSync = () => {
  const { isOnline } = usePWA();
  const [pendingSync, setPendingSync] = useState<OfflineData[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

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
  const saveForOfflineSync = (data: any, type: string, table?: string, primaryKey?: Record<string, any>) => {
    const offlineData: OfflineData = {
      timestamp: Date.now(),
      data,
      type,
      table,
      primaryKey,
    };

    const updated = [...pendingSync, offlineData];
    setPendingSync(updated);
    localStorage.setItem('sleepersheets-pending-sync', JSON.stringify(updated));
  };

  // Sync pending data when online
  const syncPendingData = async () => {
    if (!isOnline || pendingSync.length === 0) return;
    setIsSyncing(true);

    try {
      let successCount = 0;
      let failureCount = 0;
      
      // Process each pending sync item
      for (const item of pendingSync) {
        try {
          if (item.table && item.data) {
            // Add updated_at timestamp to ensure "last writer wins"
            const dataWithTimestamp = {
              ...item.data,
              updated_at: new Date().toISOString()
            };
            
            // Perform upsert operation
            const { error } = await supabase
              .from(item.table)
              .upsert(dataWithTimestamp, {
                onConflict: Object.keys(item.primaryKey || {}).join(',')
              });
              
            if (error) {
              console.error(`Error syncing item to ${item.table}:`, error);
              failureCount++;
            } else {
              successCount++;
            }
          } else {
            console.log('Skipping sync for item without table or data:', item);
            failureCount++;
          }
        } catch (error) {
          console.error('Error processing sync item:', error);
          failureCount++;
        }
      }

      // Show toast with results
      if (successCount > 0) {
        toast({
          title: "Sync Complete",
          description: `Successfully synced ${successCount} items${failureCount > 0 ? `, ${failureCount} failed` : ''}`
        });
        
        // Clear pending sync data
        setPendingSync([]);
        localStorage.removeItem('sleepersheets-pending-sync');
        
        // Update last sync time
        const now = Date.now();
        setLastSyncTime(now);
        localStorage.setItem('sleepersheets-last-sync', now.toString());
      } else if (failureCount > 0) {
        toast({
          title: "Sync Failed",
          description: `Failed to sync ${failureCount} items. Will retry later.`,
          variant: "destructive"
        });
      }
      
    } catch (error) {
      console.error('Error syncing offline data:', error);
      toast({
        title: "Sync Error",
        description: "An error occurred while syncing your data",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
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
    isSyncing,
    saveForOfflineSync,
    syncPendingData,
    clearPendingSync,
  };
}
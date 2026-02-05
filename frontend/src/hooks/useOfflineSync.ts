// React hook for offline sync
import { useState, useEffect } from 'react';
import { NetworkManager } from '@/lib/sync/NetworkManager';
import { SyncManager } from '@/lib/sync/SyncManager';

export function useOfflineSync() {
  const networkManager = NetworkManager.getInstance();
  const syncManager = SyncManager.getInstance();
  
  const [isOnline, setIsOnline] = useState(networkManager.isOnline());
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = networkManager.onStatusChange((status) => {
      setIsOnline(status.isOnline);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const syncNow = async () => {
    setIsSyncing(true);
    await syncManager.syncPendingOperations();
    setIsSyncing(false);
  };

  return {
    isOnline,
    isSyncing,
    syncNow,
  };
}

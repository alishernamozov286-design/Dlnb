import { useState, useEffect } from 'react';
import { NetworkManager } from '@/lib/sync/NetworkManager';

interface BackendStatus {
  isOnline: boolean;
  isLoading: boolean;
  lastChecked: Date;
  error?: string;
  internetConnected: boolean;
  backendHealthy: boolean;
}

export function useBackendStatus() {
  const networkManager = NetworkManager.getInstance();
  
  const [status, setStatus] = useState<BackendStatus>({
    isOnline: false,
    isLoading: true,
    lastChecked: new Date(),
    internetConnected: false,
    backendHealthy: false
  });

  const checkBackendStatus = async (): Promise<boolean> => {
    // NetworkManager handles all checks
    const networkStatus = await networkManager.forceCheck();
    
    setStatus({
      isOnline: networkStatus.isOnline,
      isLoading: networkStatus.isChecking,
      lastChecked: networkStatus.lastChecked,
      error: undefined,
      internetConnected: networkStatus.internetConnected,
      backendHealthy: networkStatus.backendHealthy
    });

    return networkStatus.isOnline;
  };

  // Listen to NetworkManager status changes
  useEffect(() => {
    const unsubscribe = networkManager.onStatusChange((networkStatus) => {
      setStatus({
        isOnline: networkStatus.isOnline,
        isLoading: networkStatus.isChecking,
        lastChecked: networkStatus.lastChecked,
        error: undefined,
        internetConnected: networkStatus.internetConnected,
        backendHealthy: networkStatus.backendHealthy
      });
    });

    return () => unsubscribe();
  }, []);

  // Manual refresh
  const refresh = () => {
    setStatus(prev => ({ ...prev, isLoading: true }));
    checkBackendStatus();
  };

  return {
    ...status,
    refresh,
    checkStatus: checkBackendStatus
  };
}

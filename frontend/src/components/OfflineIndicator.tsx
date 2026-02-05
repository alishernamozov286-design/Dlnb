// Offline status indicator component
import { useBackendStatus } from '../hooks/useBackendStatus';
import { WifiOff, Wifi, RefreshCw, AlertTriangle } from 'lucide-react';
import { t } from '@/lib/transliteration';
import { useState, useEffect } from 'react';
import { NetworkManager } from '@/lib/sync/NetworkManager';
import { SyncManager } from '@/lib/sync/SyncManager';

export function OfflineIndicator() {
  const { isOnline: backendOnline } = useBackendStatus();
  const [isOnline, setIsOnline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [language] = useState<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  });

  useEffect(() => {
    const networkManager = NetworkManager.getInstance();
    const syncManager = SyncManager.getInstance();
    
    const unsubscribeNetwork = networkManager.onStatusChange((status) => {
      setIsOnline(status.isOnline);
    });
    
    const unsubscribeSync = syncManager.onSyncComplete(() => {
      setIsSyncing(false);
    });
    
    return () => {
      unsubscribeNetwork();
      unsubscribeSync();
    };
  }, []);

  const syncNow = async () => {
    const syncManager = SyncManager.getInstance();
    setIsSyncing(true);
    await syncManager.forceSyncNow();
  };

  // Agar backend offline bo'lsa, maxsus xabar ko'rsatish
  if (!backendOnline) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 max-w-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <div className="text-sm">
            <div className="font-medium">{t('Offline rejim', language)}</div>
            <div className="text-xs opacity-90">
              {t('Faqat avtomobillar sahifasi ishlaydi', language)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isOnline && !isSyncing) {
    return null; // Don't show anything when online and not syncing
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      {!isOnline && (
        <div className="bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <WifiOff className="w-5 h-5" />
          <span className="font-medium">{t('Offline rejim', language)}</span>
        </div>
      )}

      {isOnline && isSyncing && (
        <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span className="font-medium">{t('Sinxronlashtirilmoqda...', language)}</span>
        </div>
      )}

      {isOnline && !isSyncing && (
        <button
          onClick={syncNow}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 transition-colors"
        >
          <Wifi className="w-5 h-5" />
          <span className="font-medium">{t('Sinxronlash', language)}</span>
        </button>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { SyncManager } from '@/lib/sync/SyncManager';
import { SyncResult } from '@/lib/types/base';
import { X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export function SyncStatusNotification() {
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const syncManager = SyncManager.getInstance();

    // Listen to sync status
    const checkSyncStatus = setInterval(() => {
      const syncing = syncManager.isSyncInProgress();
      setIsSyncing(syncing);
      
      if (syncing) {
        setShow(true);
      }
    }, 500);

    // Listen to sync results
    const unsubscribe = syncManager.onSyncComplete((result) => {
      setSyncResult(result);
      setShow(true);
      setIsSyncing(false);

      // Auto hide after 10 seconds if successful
      if (result.failed === 0 && result.success > 0) {
        setTimeout(() => {
          setShow(false);
        }, 10000);
      }
    });

    return () => {
      clearInterval(checkSyncStatus);
      unsubscribe();
    };
  }, []);

  if (!show) return null;

  const handleClose = () => {
    setShow(false);
    setSyncResult(null);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {isSyncing ? (
              <>
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                <h3 className="font-semibold text-gray-900">Sinxronlanmoqda...</h3>
              </>
            ) : syncResult && syncResult.failed === 0 ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold text-gray-900">Sinxronlash tugadi</h3>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                <h3 className="font-semibold text-gray-900">Sinxronlash tugadi (xatolar bilan)</h3>
              </>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {syncResult && !isSyncing && (
          <div className="space-y-2">
            {syncResult.success > 0 && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span>{syncResult.success} ta operatsiya muvaffaqiyatli</span>
              </div>
            )}

            {syncResult.failed > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>{syncResult.failed} ta operatsiya xato</span>
                </div>
                
                {syncResult.errors.length > 0 && (
                  <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                    {syncResult.errors.map((error, index) => (
                      <div key={index} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                        {error}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {syncResult.success === 0 && syncResult.failed === 0 && (
              <div className="text-sm text-gray-500">
                Sinxronlash uchun ma'lumot yo'q
              </div>
            )}
          </div>
        )}

        {isSyncing && (
          <div className="text-sm text-gray-500">
            Offline ma'lumotlar server'ga yuklanmoqda...
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Offline Status Indicator - Production-Ready Component
 * 
 * Shows current network status and sync information
 * Provides manual sync trigger when online
 */

import React from 'react';
import { Wifi, WifiOff, RefreshCw, Database, AlertCircle, CheckCircle } from 'lucide-react';
import { useBackendStatus } from '../hooks/useBackendStatus';
import { t } from '../lib/transliteration';

interface OfflineStatusIndicatorProps {
  pendingCount?: number;
  onSyncNow?: () => void;
  className?: string;
}

export const OfflineStatusIndicator: React.FC<OfflineStatusIndicatorProps> = ({
  pendingCount = 0,
  onSyncNow,
  className = ''
}) => {
  const { isOnline, isLoading: isChecking, backendHealthy, internetConnected } = useBackendStatus();
  const [isSyncing, setIsSyncing] = React.useState(false);

  // localStorage'dan tilni o'qish
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  const handleSyncNow = async () => {
    if (!isOnline || isSyncing) return;
    
    try {
      setIsSyncing(true);
      if (onSyncNow) {
        await onSyncNow();
      }
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Don't show anything if online and no pending operations
  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      <div className={`
        flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-sm
        transition-all duration-300 hover:shadow-xl
        ${isOnline 
          ? 'bg-green-50/90 border-green-200 text-green-800' 
          : 'bg-red-50/90 border-red-200 text-red-800'
        }
      `}>
        {/* Status Icon */}
        <div className="flex-shrink-0">
          {isChecking ? (
            <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
          ) : isOnline ? (
            <Wifi className="h-5 w-5 text-green-600" />
          ) : (
            <WifiOff className="h-5 w-5 text-red-600" />
          )}
        </div>

        {/* Status Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">
              {isChecking ? t('Tekshirilmoqda...', language) : isOnline ? t('Online', language) : t('Offline', language)}
            </span>
            
            {/* Connection Details */}
            {!isOnline && (
              <div className="flex items-center gap-1 text-xs">
                {!internetConnected && (
                  <span className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {t('Internet yo\'q', language)}
                  </span>
                )}
                {internetConnected && !backendHealthy && (
                  <span className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {t('Server ishlamayapti', language)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Pending Operations */}
          {pendingCount > 0 && (
            <div className="flex items-center gap-1 text-xs mt-1">
              <Database className="h-3 w-3" />
              <span>
                {pendingCount} {t('kutilayotgan operatsiya', language)}{pendingCount !== 1 ? '' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Sync Button */}
        {isOnline && pendingCount > 0 && (
          <button
            onClick={handleSyncNow}
            disabled={isSyncing}
            className={`
              flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium
              transition-all duration-200 hover:scale-105
              ${isSyncing
                ? 'bg-blue-100 text-blue-600 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700 active:scale-95'
              }
            `}
            title="Sync pending operations now"
          >
            <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? t('Sinxronlanmoqda...', language) : t('Hozir sinxronlash', language)}
          </button>
        )}

        {/* Success Indicator */}
        {isOnline && pendingCount === 0 && (
          <CheckCircle className="h-4 w-4 text-green-600" />
        )}
      </div>

      {/* Offline Mode Notice */}
      {!isOnline && (
        <div className="mt-2 px-4 py-2 bg-amber-50/90 border border-amber-200 rounded-lg text-amber-800 text-xs backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-3 w-3 flex-shrink-0" />
            <span>
              {t('Faqat Mashinalar sahifasi offline rejimda ishlaydi. O\'zgarishlar online bo\'lganda sinxronlanadi.', language)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineStatusIndicator;
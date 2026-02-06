/**
 * OfflineTransitionModal - Ultra Professional Transition UI
 * 
 * Senior Developer Level - Premium UX/UI Design
 * Features:
 * - Glassmorphism design
 * - Smooth animations
 * - Professional color schemes
 * - Auto-close with progress bar
 * - Shows on both offline→online AND online→offline transitions
 */

import { useEffect, useState } from 'react';
import { NetworkManager } from '@/lib/sync/NetworkManager';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, Cloud } from 'lucide-react';

export const OfflineTransitionModal = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const networkManager = NetworkManager.getInstance();
    let previousOnlineState: boolean | null = null;
    let isInitialized = false;
    
    // Listen to network status changes
    const unsubscribe = networkManager.onStatusChange((status) => {
      // Skip first call (initialization) va refresh paytida
      if (!isInitialized) {
        previousOnlineState = status.isOnline;
        isInitialized = true;
        return;
      }
      
      const nowOnline = status.isOnline;
      
      // Show modal only when status actually changes
      if (previousOnlineState !== nowOnline) {
        console.log('🔄 Network status changed:', previousOnlineState ? 'online' : 'offline', '→', nowOnline ? 'online' : 'offline');
        
        setIsOnline(nowOnline);
        setIsVisible(true);
        setProgress(100);
        
        // Auto-close duration: 0.8 seconds for online, 1.5 seconds for offline (ULTRA FAST)
        const duration = nowOnline ? 800 : 1500; // Ultra tez yopilish
        const interval = 30;
        const step = (interval / duration) * 100;
        
        const progressInterval = setInterval(() => {
          setProgress(prev => {
            const newProgress = prev - step;
            if (newProgress <= 0) {
              clearInterval(progressInterval);
              setIsVisible(false);
              return 0;
            }
            return newProgress;
          });
        }, interval);
        
        // Update previous state
        previousOnlineState = nowOnline;
        
        return () => clearInterval(progressInterval);
      }
    });
    
    return () => unsubscribe();
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-fadeIn pointer-events-auto" />
      
      {/* Modal */}
      <div className="relative z-10 animate-scaleIn pointer-events-auto">
        <div className={`
          relative overflow-hidden rounded-3xl shadow-2xl
          ${isOnline 
            ? 'bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600' 
            : 'bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-600'
          }
          p-8 min-w-[320px] max-w-md
        `}>
          {/* Glassmorphism overlay */}
          <div className="absolute inset-0 bg-white/10 backdrop-blur-xl" />
          
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl animate-pulse delay-300" />
          </div>
          
          {/* Content */}
          <div className="relative z-10 text-center">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className={`
                relative p-4 rounded-full bg-white/20 backdrop-blur-sm
                ${isOnline ? 'animate-bounce' : 'animate-pulse'}
              `}>
                {isOnline ? (
                  <>
                    <Wifi className="h-12 w-12 text-white animate-fadeIn" />
                    <div className="absolute -top-1 -right-1">
                      <CheckCircle2 className="h-6 w-6 text-white animate-scaleIn" />
                    </div>
                  </>
                ) : (
                  <WifiOff className="h-12 w-12 text-white animate-fadeIn" />
                )}
              </div>
            </div>
            
            {/* Title */}
            <h3 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">
              {isOnline ? 'Online rejimga o\'tmoqda' : 'Internet aloqasi yo\'q'}
            </h3>
            
            {/* Description */}
            <p className="text-white/90 text-sm mb-4 drop-shadow">
              {isOnline ? (
                <>
                  <RefreshCw className="inline h-4 w-4 mr-1 animate-spin" />
                  Ma'lumotlar sinxronlanmoqda...
                </>
              ) : (
                <>
                  <Cloud className="inline h-4 w-4 mr-1" />
                  Offline rejimda ishlash davom etmoqda
                </>
              )}
            </p>
            
            {/* Status indicator */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className={`
                w-2 h-2 rounded-full animate-pulse
                ${isOnline ? 'bg-white' : 'bg-white/70'}
              `} />
              <span className="text-white/80 text-xs font-medium">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfflineTransitionModal;

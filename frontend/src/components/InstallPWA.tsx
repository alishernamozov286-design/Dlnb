import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { t } from '@/lib/transliteration';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPWA: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  useEffect(() => {
    // Check if already installed
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://');
    
    setIsStandalone(isInStandaloneMode);

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // Debug: Log PWA status
    const debugInfo = {
      isHTTPS: window.location.protocol === 'https:',
      isLocalhost: window.location.hostname === 'localhost',
      isStandalone: isInStandaloneMode,
      isIOS: iOS,
      hasServiceWorker: 'serviceWorker' in navigator,
      userAgent: navigator.userAgent,
      dismissed: localStorage.getItem('pwa-install-dismissed'),
      dismissedIOS: localStorage.getItem('pwa-install-dismissed-ios'),
    };
    console.log('[PWA] Status:', debugInfo);

    // Listen for beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('[PWA] ✅ beforeinstallprompt event fired!');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Check if user dismissed before
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        console.log('[PWA] Showing install prompt');
        setShowInstallPrompt(true);
      } else {
        console.log('[PWA] User previously dismissed');
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if iOS and not installed
    if (iOS && !isInStandaloneMode) {
      const dismissed = localStorage.getItem('pwa-install-dismissed-ios');
      if (!dismissed) {
        console.log('[PWA] iOS detected, showing install instructions');
        setShowInstallPrompt(true);
      }
    }

    // Log after 3 seconds if no event
    setTimeout(() => {
      if (!deferredPrompt && !iOS) {
        console.warn('[PWA] ⚠️ beforeinstallprompt event not fired after 3s');
        console.log('[PWA] Possible reasons:');
        console.log('  1. Already installed');
        console.log('  2. Not HTTPS (except localhost)');
        console.log('  3. Manifest.json not valid');
        console.log('  4. Service Worker not registered');
        console.log('  5. Browser does not support PWA');
        console.log('  6. User previously dismissed and criteria not met again');
      }
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('PWA installed');
    }

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    if (isIOS) {
      localStorage.setItem('pwa-install-dismissed-ios', 'true');
    } else {
      localStorage.setItem('pwa-install-dismissed', 'true');
    }
  };

  // Don't show if already installed
  if (isStandalone) {
    return null;
  }

  if (!showInstallPrompt) {
    return null;
  }

  // iOS Install Instructions
  if (isIOS) {
    return (
      <div className="fixed bottom-4 right-4 w-80 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50 animate-slide-up">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
        
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Download className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1 pr-4">
            <h3 className="text-sm font-bold text-gray-900 mb-1">
              {t("Ilovani o'rnatish", language)}
            </h3>
            <p className="text-xs text-gray-600 mb-2">
              {t("Safari: Ulashish ⎙ → Bosh ekranga qo'shish", language)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Android/Chrome Install Button
  return (
    <div className="fixed bottom-4 right-4 w-80 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-4 z-50 animate-slide-up">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-white/80 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
      
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
          <Download className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 pr-4">
          <h3 className="text-sm font-bold text-white mb-0.5">
            {t("Ilovani o'rnatish", language)}
          </h3>
          <p className="text-xs text-blue-100">
            {t("Tezroq kirish", language)}
          </p>
        </div>
      </div>
      
      <button
        onClick={handleInstallClick}
        className="w-full bg-white text-blue-600 font-semibold py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-sm"
      >
        <Download className="h-4 w-4" />
        {t("O'rnatish", language)}
      </button>
    </div>
  );
};

export default InstallPWA;

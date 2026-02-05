import React from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = React.useState(false);

  React.useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      // PWA installed successfully
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 animate-slide-up">
      <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-2xl p-4 text-white">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-lg transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="flex-1">
            <h3 className="text-base font-bold mb-0.5">
              Biznes ni o'rnating
            </h3>
            <p className="text-xs text-blue-100 mb-2">
              Telefon ekraniga qo'shing
            </p>
            
            <button
              onClick={handleInstall}
              className="w-full bg-white text-blue-600 font-semibold py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center space-x-1.5 text-sm"
            >
              <Download className="h-4 w-4" />
              <span>O'rnatish</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;

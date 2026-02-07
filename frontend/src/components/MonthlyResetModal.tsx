import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle, Loader } from 'lucide-react';
import { t } from '@/lib/transliteration';
import { formatCurrency } from '@/lib/utils';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';

interface MonthlyResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  currentStats?: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
  };
}

const MonthlyResetModal: React.FC<MonthlyResetModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  currentStats 
}) => {
  const [isResetting, setIsResetting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  useBodyScrollLock(isOpen);

  const handleConfirm = async () => {
    setIsResetting(true);
    try {
      await onConfirm();
      setShowSuccess(true);
      
      // Cache'ni tozalash
      try {
        // Transactions cache'ni tozalash
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('rq_cache_') || key.includes('transactions') || key.includes('summary')) {
            localStorage.removeItem(key);
          }
        });
      } catch (err) {
        console.error('Cache clear error:', err);
      }
      
      // 2 soniyadan keyin sahifani yangilash
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Reset xatosi:', error);
      setIsResetting(false);
    }
  };

  const handleClose = () => {
    if (!isResetting) {
      onClose();
      setShowSuccess(false);
    }
  };

  if (!isOpen) return null;

  // Success screen
  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        
        <div className="relative bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-scale-in">
          <div className="text-center">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3 animate-bounce">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {t("Muvaffaqiyatli!", language)}
            </h3>
            
            <p className="text-sm text-gray-600 mb-4">
              {t("Oylik reset amalga oshirildi", language)}
            </p>
            
            <div className="flex items-center justify-center gap-2 text-blue-600">
              <Loader className="h-4 w-4 animate-spin" />
              <span className="text-xs">{t("Yuklanmoqda...", language)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Confirmation screen
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      
      <div className="relative bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-pink-600 px-4 py-3">
          <button 
            onClick={handleClose} 
            disabled={isResetting}
            className="absolute top-2 right-2 text-white/80 hover:text-white rounded-lg p-1 transition-colors disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
          
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-white" />
            <h2 className="text-base font-bold text-white">{t("Oylik Reset", language)}</h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Current Stats */}
          {currentStats && (
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-green-50 rounded-lg p-2">
                <p className="text-xs text-green-600 mb-0.5">{t('Kirim', language)}</p>
                <p className="text-sm font-bold text-green-900">
                  {formatCurrency(currentStats.totalIncome)}
                </p>
              </div>

              <div className="bg-red-50 rounded-lg p-2">
                <p className="text-xs text-red-600 mb-0.5">{t('Chiqim', language)}</p>
                <p className="text-sm font-bold text-red-900">
                  {formatCurrency(currentStats.totalExpense)}
                </p>
              </div>

              <div className="bg-blue-50 rounded-lg p-2">
                <p className="text-xs text-blue-600 mb-0.5">{t('Balans', language)}</p>
                <p className={`text-sm font-bold ${currentStats.balance >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                  {formatCurrency(currentStats.balance)}
                </p>
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-2.5">
            <p className="text-xs text-red-700">
              {t("Ma'lumotlar tarixga saqlanadi va statistika 0 ga qaytariladi", language)}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t px-4 py-3 flex gap-2">
          <button
            onClick={handleClose}
            disabled={isResetting}
            className="flex-1 px-3 py-2 text-xs font-semibold text-gray-700 bg-white border rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            {t('Bekor qilish', language)}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isResetting}
            className="flex-1 px-3 py-2 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {isResetting ? (
              <>
                <Loader className="h-3 w-3 animate-spin" />
                {t('Yuklanmoqda...', language)}
              </>
            ) : (
              t("Reset qilish", language)
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MonthlyResetModal;

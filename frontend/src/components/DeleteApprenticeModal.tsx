import React, { useState } from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import { User as UserType } from '@/types';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { t } from '@/lib/transliteration';
import api from '@/lib/api';

interface DeleteApprenticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  apprentice: UserType | null;
  onDelete: () => void;
}

const DeleteApprenticeModal: React.FC<DeleteApprenticeModalProps> = ({ isOpen, onClose, apprentice, onDelete }) => {
  const [isLoading, setIsLoading] = useState(false);

  // localStorage'dan tilni o'qish
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  // Modal ochilganda body scroll ni bloklash
  useBodyScrollLock(isOpen);

  const handleDelete = async () => {
    if (!apprentice) return;

    setIsLoading(true);
    try {
      await api.delete(`/auth/users/${apprentice._id}`);
      onDelete();
      onClose();
    } catch (error: any) {
      console.error('Delete error:', error);
      alert(error.response?.data?.message || t('Xatolik yuz berdi', language));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !apprentice) return null;

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-rose-600 px-6 py-5 rounded-t-2xl">
            <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors">
              <X className="h-5 w-5" />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <Trash2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{t("Shogirtni o'chirish", language)}</h2>
                <p className="text-red-100 text-sm">{t("Bu amalni qaytarib bo'lmaydi", language)}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Warning Box */}
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">{t('Diqqat!', language)}</h3>
                  <p className="text-sm text-red-700">
                    {t('Siz', language)} <span className="font-bold">{t(apprentice.name, language)}</span> {t("shogirtni o'chirmoqchisiz. Bu amal qaytarilmaydi va barcha ma'lumotlar yo'qoladi.", language)}
                  </p>
                </div>
              </div>
            </div>

            {/* Apprentice Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-lg">
                  {t(apprentice.name, language).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{t(apprentice.name, language)}</h4>
                  <p className="text-sm text-gray-600">@{apprentice.username}</p>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {t('Bekor qilish', language)}
              </button>
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-rose-600 rounded-lg hover:from-red-700 hover:to-rose-700 disabled:opacity-50 transition-all shadow-md hover:shadow-lg"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t("O'chirilmoqda...", language)}
                  </span>
                ) : (
                  t("Ha, o'chirish", language)
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteApprenticeModal;

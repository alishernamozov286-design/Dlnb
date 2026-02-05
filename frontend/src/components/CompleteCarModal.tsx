import React, { useState } from 'react';
import { CheckCircle, X, AlertTriangle, FileText } from 'lucide-react';
import { Car } from '@/types';
import { useCarsNew } from '@/hooks/useCarsNew';
import { formatCurrency } from '@/lib/utils';
import { t } from '@/lib/transliteration';

interface CompleteCarModalProps {
  isOpen: boolean;
  onClose: () => void;
  car: Car;
  onComplete?: () => void;
}

const CompleteCarModal: React.FC<CompleteCarModalProps> = ({
  isOpen,
  onClose,
  car,
  onComplete
}) => {
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { updateCar } = useCarsNew();

  // localStorage'dan tilni o'qish
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  // Calculate debt amount
  const totalAmount = car.totalEstimate || 0;
  const paidAmount = car.paidAmount || 0;
  const remainingAmount = totalAmount - paidAmount;
  const hasDebt = remainingAmount > 0;

  const handleComplete = async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      await updateCar(car._id, { 
        status: 'completed'
      });
      
      if (onComplete) {
        onComplete();
      }
      
      onClose();
    } catch (err: any) {
      console.error('Mashinani tugatishda xatolik:', err);
      setError(err.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{t("Ishni tugatish", language)}</h2>
                <p className="text-green-100 text-sm">
                  {car.make} {car.carModel} ({car.licensePlate})
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Car Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 mb-3">{t("Mashina ma'lumotlari", language)}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">{t("Egasi", language)}:</span>
                <span className="font-medium">{car.ownerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t("Telefon", language)}:</span>
                <span className="font-medium">{car.ownerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t("Jami narx", language)}:</span>
                <span className="font-bold text-green-600">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t("To'langan", language)}:</span>
                <span className="font-medium text-blue-600">{formatCurrency(paidAmount)}</span>
              </div>
              {hasDebt && (
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600">{t("Qarz", language)}:</span>
                  <span className="font-bold text-red-600">{formatCurrency(remainingAmount)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Debt Warning */}
          {hasDebt && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-amber-800 mb-1">
                    {t("Qarz mavjud", language)}
                  </h4>
                  <p className="text-amber-700 text-sm">
                    {t("Mashina tugatilganda avtomatik ravishda qarz daftariga", language)} {formatCurrency(remainingAmount)} {t("miqdorida qarz qo'shiladi", language)}.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <FileText className="h-4 w-4 inline mr-1" />
              {t("Izoh (ixtiyoriy)", language)}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("Qo'shimcha izoh yozing...", language)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none"
              rows={3}
              maxLength={500}
            />
            <div className="text-xs text-gray-500 mt-1">
              {notes.length}/500 {t("belgi", language)}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="text-red-700 font-medium">{error}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            disabled={isLoading}
          >
            {t("Bekor qilish", language)}
          </button>
          <button
            onClick={handleComplete}
            disabled={isLoading}
            className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>{t("Tugatilyapti...", language)}</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>{t("Ishni tugatish", language)}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompleteCarModal;
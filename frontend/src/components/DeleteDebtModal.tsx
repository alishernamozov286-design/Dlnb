import React from 'react';
import { X, AlertTriangle, DollarSign } from 'lucide-react';
import { Debt } from '@/types';
import { useDeleteDebt } from '@/hooks/useDebts';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { formatCurrency } from '@/lib/utils';
import { t } from '@/lib/transliteration';

interface DeleteDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: Debt;
}

const DeleteDebtModal: React.FC<DeleteDebtModalProps> = ({ isOpen, onClose, debt }) => {
  const deleteDebtMutation = useDeleteDebt();
  useBodyScrollLock(isOpen);

  // localStorage'dan tilni o'qish
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  const handleDelete = async () => {
    try {
      await deleteDebtMutation.mutateAsync(debt._id);
      onClose();
    } catch (error) {
      console.error('Error deleting debt:', error);
    }
  };

  if (!isOpen) return null;

  const getTypeText = (type: string) => {
    return type === 'receivable' ? t('Bizga qarzi bor', language) : t('Bizning qarzimiz', language);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-xl">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">{t("Qarzni o'chirish", language)}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start space-x-4 mb-6">
            <div className="flex-shrink-0">
              <div className="bg-red-100 rounded-full p-3">
                <DollarSign className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {debt.creditorName}
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                {getTypeText(debt.type)}
              </p>
              <div className="space-y-1.5">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">{t('Umumiy summa:', language)}</span> {formatCurrency(debt.amount)}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">{t("To'langan:", language)}</span> {formatCurrency(debt.paidAmount)}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">{t('Qolgan:', language)}</span> {formatCurrency(debt.amount - debt.paidAmount)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-900 mb-1">
                  {t("Diqqat! Bu amalni qaytarib bo'lmaydi", language)}
                </p>
                <p className="text-sm text-red-800">
                  {t("Qarzni o'chirsangiz, unga bog'liq barcha to'lov tarixi ham o'chiriladi. Bu ma'lumotlarni qayta tiklab bo'lmaydi.", language)}
                </p>
              </div>
            </div>
          </div>

          {debt.paymentHistory && debt.paymentHistory.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-amber-800">
                <strong>{t('Ogohlantirish:', language)}</strong> {t('Bu qarzda', language)} {debt.paymentHistory.length} {t("ta to'lov tarixi mavjud. Ularning barchasi o'chiriladi.", language)}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={deleteDebtMutation.isPending}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            {t('Bekor qilish', language)}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteDebtMutation.isPending}
            className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
          >
            {deleteDebtMutation.isPending ? t("O'chirilmoqda...", language) : t("Ha, o'chirish", language)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteDebtModal;

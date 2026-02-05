import React, { useState } from 'react';
import { X, DollarSign, User, Phone, Calendar } from 'lucide-react';
import { useCreateDebt } from '@/hooks/useDebts';
import { formatPhoneNumber } from '@/lib/phoneUtils';
import { formatNumber, parseFormattedNumber } from '@/lib/utils';
import { t } from '@/lib/transliteration';

interface CreateDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateDebtModal: React.FC<CreateDebtModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    type: 'receivable' as 'receivable' | 'payable',
    amount: 0,
    creditorName: '',
    creditorPhone: '',
    dueDate: ''
  });
  const [amountDisplay, setAmountDisplay] = useState('');

  // localStorage'dan tilni o'qish
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  const createDebtMutation = useCreateDebt();

  if (!isOpen) return null;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatNumber(value);
    const numericValue = parseFormattedNumber(formatted);
    
    setAmountDisplay(formatted);
    setFormData(prev => ({
      ...prev,
      amount: numericValue
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Telefon raqam uchun maxsus formatlash
    if (name === 'creditorPhone') {
      const formatted = formatPhoneNumber(value);
      setFormData(prev => ({
        ...prev,
        [name]: formatted
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.creditorName || formData.amount <= 0) {
      alert(t("Barcha majburiy maydonlarni to'ldiring", language));
      return;
    }
    
    try {
      await createDebtMutation.mutateAsync(formData);
      setFormData({
        type: 'receivable',
        amount: 0,
        creditorName: '',
        creditorPhone: '',
        dueDate: ''
      });
      setAmountDisplay('');
      onClose();
    } catch (error) {
      }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 pt-20 sm:pt-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">{t("Yangi qarz qo'shish", language)}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <DollarSign className="h-4 w-4 inline mr-1" />
                {t('Qarz turi', language)} *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="input"
                required
              >
                <option value="receivable">{t('Bizga qarzi bor (Mijoz qarzda)', language)}</option>
                <option value="payable">{t('Bizning qarzimiz (Biz qarzda)', language)}</option>
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <DollarSign className="h-4 w-4 inline mr-1" />
                {t("Summa (so'm)", language)} *
              </label>
              <input
                type="text"
                value={amountDisplay}
                onChange={handleAmountChange}
                className="input"
                placeholder="1.000.000"
                required
              />
            </div>

            {/* Creditor Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User className="h-4 w-4 inline mr-1" />
                {formData.type === 'receivable' ? t('Mijoz ismi', language) : t("Ta'minotchi ismi", language)} *
              </label>
              <input
                type="text"
                name="creditorName"
                value={formData.creditorName}
                onChange={handleInputChange}
                className="input"
                placeholder={formData.type === 'receivable' ? t('Mijoz ismini kiriting', language) : t("Ta'minotchi ismini kiriting", language)}
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Phone className="h-4 w-4 inline mr-1" />
                {t('Telefon raqami', language)}
              </label>
              <input
                type="tel"
                name="creditorPhone"
                value={formData.creditorPhone}
                onChange={handleInputChange}
                className="input"
                placeholder="+998 90 123 45 67"
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="h-4 w-4 inline mr-1" />
                {t("To'lov muddati", language)}
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
                className="input"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Info */}
            <div className={`p-3 rounded-lg border ${
              formData.type === 'receivable' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <p className={`text-sm ${
                formData.type === 'receivable' ? 'text-green-800' : 'text-red-800'
              }`}>
                <strong>{t('Eslatma:', language)}</strong> {
                  formData.type === 'receivable' 
                    ? t("Bu qarz sizga to'lanishi kerak bo'lgan summadir.", language)
                    : t("Bu qarz siz to'lashingiz kerak bo'lgan summadir.", language)
                }
              </p>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
              >
                {t('Bekor qilish', language)}
              </button>
              <button
                type="submit"
                disabled={createDebtMutation.isPending}
                className="btn-primary disabled:opacity-50"
              >
                {createDebtMutation.isPending ? t('Saqlanmoqda...', language) : t("Qarz qo'shish", language)}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateDebtModal;
import React, { useState, useEffect } from 'react';
import { X, DollarSign, User, Phone, Calendar, FileText } from 'lucide-react';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { formatNumber, parseFormattedNumber } from '@/lib/utils';
import { t } from '@/lib/transliteration';
import toast from 'react-hot-toast';

type Debt = {
  _id: string;
  creditorName: string;
  creditorPhone?: string;
  amount: number;
  paidAmount: number;
  type: 'receivable' | 'payable';
  status: 'pending' | 'partial' | 'paid';
  dueDate?: string;
  description?: string;
  paymentHistory?: Array<{
    amount: number;
    date: string;
    notes?: string;
  }>;
  createdBy?: {
    _id: string;
    name: string;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
};

interface EditDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: Debt;
  onUpdate: (id: string, data: any) => Promise<any>;
}

const EditDebtModal: React.FC<EditDebtModalProps> = ({ isOpen, onClose, debt, onUpdate }) => {
  const [formData, setFormData] = useState({
    creditorName: '',
    creditorPhone: '',
    amount: 0,
    type: 'receivable' as 'receivable' | 'payable',
    dueDate: '',
    description: ''
  });
  const [amountDisplay, setAmountDisplay] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // localStorage'dan tilni o'qish
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (debt && isOpen) {
      setFormData({
        creditorName: debt.creditorName,
        creditorPhone: debt.creditorPhone || '',
        amount: debt.amount,
        type: debt.type,
        dueDate: debt.dueDate ? new Date(debt.dueDate).toISOString().split('T')[0] : '',
        description: debt.description || ''
      });
      setAmountDisplay(formatNumber(debt.amount.toString()));
    }
  }, [debt, isOpen]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.creditorName || formData.amount <= 0) {
      toast.error(t("Barcha majburiy maydonlarni to'ldiring", language));
      return;
    }

    setIsSubmitting(true);
    
    try {
      // ⚡ INSTANT: Modal darhol yopiladi
      onClose();
      
      // Background'da yangilash
      await onUpdate(debt._id, formData);
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('Xatolik yuz berdi', language));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 backdrop-blur-sm p-2 rounded-xl">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-white">{t('Qarzni tahrirlash', language)}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto scrollbar-hide p-6">
          <div className="space-y-5">
            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('Qarz turi', language)} *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                required
              >
                <option value="receivable">{t('Bizga qarzi bor', language)}</option>
                <option value="payable">{t('Bizning qarzimiz', language)}</option>
              </select>
            </div>

            {/* Creditor Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="h-4 w-4 inline mr-1" />
                  {t('Ism / Kompaniya nomi', language)} *
                </label>
                <input
                  type="text"
                  name="creditorName"
                  value={formData.creditorName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder={t("Mijoz yoki ta'minotchi nomi", language)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="h-4 w-4 inline mr-1" />
                  {t('Telefon raqami', language)}
                </label>
                <input
                  type="tel"
                  name="creditorPhone"
                  value={formData.creditorPhone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="+998 XX XXX XX XX"
                />
              </div>
            </div>

            {/* Amount and Due Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  {t("Qarz summasi (so'm)", language)} *
                </label>
                <input
                  type="text"
                  value={amountDisplay}
                  onChange={handleAmountChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="1.000.000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  {t("To'lov muddati", language)}
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="h-4 w-4 inline mr-1" />
                {t('Izoh', language)}
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                placeholder={t("Qarz haqida qo'shimcha ma'lumot...", language)}
              />
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-800">
                <strong>{t('Eslatma:', language)}</strong> {t("Qarz summasini o'zgartirsangiz, to'langan summa o'zgarmaydi. Agar to'lovlar tarixini o'zgartirish kerak bo'lsa, qarzni qaytadan yarating.", language)}
              </p>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
          >
            {t('Bekor qilish', language)}
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
          >
            {isSubmitting ? t('Saqlanmoqda...', language) : t('Saqlash', language)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditDebtModal;

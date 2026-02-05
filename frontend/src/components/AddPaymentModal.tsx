import React, { useState } from 'react';
import { X, DollarSign, CreditCard, Smartphone, Wallet, AlertCircle, CheckCircle } from 'lucide-react';
import { t } from '@/lib/transliteration';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { formatCurrency, formatNumber, parseFormattedNumber } from '@/lib/utils';
import api from '@/lib/api';

interface Debt {
  _id: string;
  type: 'receivable' | 'payable';
  amount: number;
  paidAmount: number;
  creditorName: string;
  creditorPhone?: string;
  description?: string;
  status: 'pending' | 'partial' | 'paid';
}

interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: Debt | null;
  onSuccess: () => void;
}

type PaymentMethod = 'cash' | 'click' | 'card';

const AddPaymentModal: React.FC<AddPaymentModalProps> = ({ isOpen, onClose, debt, onSuccess }) => {
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amount, setAmount] = useState('');
  const [amountDisplay, setAmountDisplay] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useBodyScrollLock(isOpen);

  if (!isOpen || !debt) return null;

  const remaining = debt.amount - debt.paidAmount;

  const paymentMethods = [
    {
      id: 'cash' as PaymentMethod,
      name: t('Naqd', language),
      icon: Wallet,
      gradient: 'from-green-500 to-emerald-600',
      bgGradient: 'from-green-50 to-emerald-50',
      borderColor: 'border-green-500'
    },
    {
      id: 'click' as PaymentMethod,
      name: t('Click', language),
      icon: Smartphone,
      gradient: 'from-blue-500 to-cyan-600',
      bgGradient: 'from-blue-50 to-cyan-50',
      borderColor: 'border-blue-500'
    },
    {
      id: 'card' as PaymentMethod,
      name: t('Plastik', language),
      icon: CreditCard,
      gradient: 'from-purple-500 to-pink-600',
      bgGradient: 'from-purple-50 to-pink-50',
      borderColor: 'border-purple-500'
    }
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!amount || Number(amount) <= 0) {
      newErrors.amount = t("To'lov miqdorini kiriting", language);
    } else if (Number(amount) > remaining) {
      newErrors.amount = t("To'lov miqdori qolgan qarzdan oshmasligi kerak", language);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAmountChange = (value: string) => {
    const formatted = formatNumber(value);
    const numericValue = parseFormattedNumber(formatted);
    
    setAmount(numericValue.toString());
    setAmountDisplay(formatted);
    
    if (errors.amount) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.amount;
        return newErrors;
      });
    }
  };

  const handleQuickAmount = (percentage: number) => {
    const quickAmount = Math.round((remaining * percentage) / 100);
    handleAmountChange(quickAmount.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const paymentNotes = `${t('To\'lov usuli', language)}: ${paymentMethods.find(m => m.id === paymentMethod)?.name}${notes ? ` - ${notes}` : ''}`;
      
      await api.post(`/debts/${debt._id}/payments`, {
        amount: Number(amount),
        notes: paymentNotes,
        paymentMethod
      });

      onSuccess();
      onClose();
      
      // Reset form
      setAmount('');
      setAmountDisplay('');
      setNotes('');
      setPaymentMethod('cash');
      setErrors({});
    } catch (error: any) {
      console.error('Error adding payment:', error);
      alert(error.response?.data?.message || t('Xatolik yuz berdi', language));
    } finally {
      setLoading(false);
    }
  };

  const selectedMethod = paymentMethods.find(m => m.id === paymentMethod)!;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto mx-2 sm:mx-0 my-4 sm:my-0">
        {/* Header */}
        <div className={`bg-gradient-to-r ${selectedMethod.gradient} px-6 py-5`}>
          <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors">
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{t("To'lov qo'shish", language)}</h2>
              <p className="text-white/90 text-sm">{debt.creditorName}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Qarz ma'lumotlari */}
          <div className={`p-4 rounded-lg bg-gradient-to-br ${selectedMethod.bgGradient} border-2 ${selectedMethod.borderColor}`}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">{t('Jami qarz', language)}</div>
                <div className="text-xl font-bold text-gray-900">{formatCurrency(debt.amount)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">{t("To'langan", language)}</div>
                <div className="text-xl font-bold text-green-600">{formatCurrency(debt.paidAmount)}</div>
              </div>
              <div className="col-span-2">
                <div className="text-sm text-gray-600 mb-1">{t('Qolgan qarz', language)}</div>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(remaining)}</div>
              </div>
            </div>
          </div>

          {/* To'lov usuli */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t("To'lov usuli", language)} *
            </label>
            <div className="grid grid-cols-3 gap-3">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                const isSelected = paymentMethod === method.id;
                
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                      isSelected
                        ? `${method.borderColor} bg-gradient-to-br ${method.bgGradient} scale-105 shadow-lg`
                        : 'border-gray-200 hover:border-gray-300 hover:scale-105'
                    }`}
                  >
                    <div className={`flex flex-col items-center gap-2 ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                      <div className={`p-3 rounded-lg ${isSelected ? `bg-gradient-to-br ${method.gradient} text-white` : 'bg-gray-100'}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-sm font-semibold">{method.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* To'lov miqdori */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("To'lov miqdori", language)} *
            </label>
            <input
              type="text"
              value={amountDisplay}
              onChange={(e) => handleAmountChange(e.target.value)}
              autoComplete="off"
              className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all text-lg font-semibold ${
                errors.amount 
                  ? 'border-red-300 focus:border-red-500' 
                  : `${selectedMethod.borderColor} focus:${selectedMethod.borderColor}`
              }`}
              placeholder="0"
            />
            {errors.amount && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {errors.amount}
              </p>
            )}

            {/* Tez to'lov tugmalari */}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleQuickAmount(25)}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                25%
              </button>
              <button
                type="button"
                onClick={() => handleQuickAmount(50)}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => handleQuickAmount(75)}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                75%
              </button>
              <button
                type="button"
                onClick={() => handleQuickAmount(100)}
                className={`px-3 py-1.5 text-sm bg-gradient-to-r ${selectedMethod.gradient} text-white rounded-lg font-medium hover:shadow-lg transition-all`}
              >
                {t("To'liq to'lash", language)}
              </button>
            </div>
          </div>

          {/* Izoh */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('Izoh', language)} ({t('ixtiyoriy', language)})
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all resize-none"
              placeholder={t("Qo'shimcha ma'lumot...", language)}
            />
          </div>

          {/* Xulosa */}
          {amount && Number(amount) > 0 && Number(amount) <= remaining && (
            <div className={`p-4 rounded-lg bg-gradient-to-br ${selectedMethod.bgGradient} border-2 ${selectedMethod.borderColor}`}>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-gray-900">{t("To'lov xulosasi", language)}</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("To'lov miqdori", language)}:</span>
                  <span className="font-bold text-gray-900">{formatCurrency(Number(amount))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("To'lov usuli", language)}:</span>
                  <span className="font-bold text-gray-900">{selectedMethod.name}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-300">
                  <span className="text-gray-600">{t("Qolgan qarz", language)}:</span>
                  <span className="font-bold text-red-600">{formatCurrency(remaining - Number(amount))}</span>
                </div>
              </div>
            </div>
          )}

          {/* Tugmalar */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {t('Bekor qilish', language)}
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r ${selectedMethod.gradient} rounded-lg hover:shadow-lg disabled:opacity-50 transition-all`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('Saqlanmoqda...', language)}
                </span>
              ) : (
                t("To'lovni tasdiqlash", language)
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPaymentModal;

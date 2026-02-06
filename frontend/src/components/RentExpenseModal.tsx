import React, { useState } from 'react';
import { X, Home, DollarSign, FileText, CreditCard, Calendar } from 'lucide-react';
import { formatNumber, parseFormattedNumber, formatCurrency } from '@/lib/utils';
import { t } from '@/lib/transliteration';

interface RentExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
  category: any;
}

const RentExpenseModal: React.FC<RentExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  category
}) => {
  const [formData, setFormData] = useState({
    propertyType: 'workshop', // workshop, office, warehouse, land
    address: '',
    landlord: '',
    amount: 0,
    amountDisplay: '',
    period: 'monthly', // monthly, quarterly, yearly
    startDate: '',
    endDate: '',
    description: '',
    paymentMethod: 'cash' as 'cash' | 'card'
  });

  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  if (!isOpen) return null;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatNumber(value);
    const numericValue = parseFormattedNumber(formatted);
    
    setFormData(prev => ({
      ...prev,
      amountDisplay: formatted,
      amount: numericValue
    }));
  };

  const getPropertyTypeText = (type: string) => {
    const types: { [key: string]: string } = {
      workshop: t('Ustaxona', language),
      office: t('Ofis', language),
      warehouse: t('Omboxona', language),
      land: t('Yer', language),
      other: t('Boshqa', language)
    };
    return types[type] || type;
  };

  const getPeriodText = (period: string) => {
    const periods: { [key: string]: string } = {
      monthly: t('Oylik', language),
      quarterly: t('Choraklik', language),
      yearly: t('Yillik', language)
    };
    return periods[period] || period;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.amount <= 0) {
      alert(t('Ijara summasi 0 dan katta bo\'lishi kerak', language));
      return;
    }

    if (!formData.address.trim()) {
      alert(t('Manzil majburiy', language));
      return;
    }

    if (!formData.landlord.trim()) {
      alert(t('Ijara beruvchi nomi majburiy', language));
      return;
    }

    const description = `${t('Ijara turi', language)}: ${getPropertyTypeText(formData.propertyType)}
${t('Manzil', language)}: ${formData.address}
${t('Ijara beruvchi', language)}: ${formData.landlord}
${t('To\'lov davri', language)}: ${getPeriodText(formData.period)}
${formData.startDate ? `${t('Boshlanish sanasi', language)}: ${formData.startDate}` : ''}
${formData.endDate ? `${t('Tugash sanasi', language)}: ${formData.endDate}` : ''}
${formData.description ? `\n${t('Qo\'shimcha ma\'lumot', language)}: ${formData.description}` : ''}`;

    onSuccess({
      amount: formData.amount,
      description: description.trim(),
      paymentMethod: formData.paymentMethod
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 rounded-t-2xl sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Home className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {t(category.nameUz, language)}
                  </h3>
                  <p className="text-green-100 text-sm">
                    {t(category.description, language)}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="text-white/80 hover:text-white">
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Ijara turi */}
              <div>
                <label className="label">
                  <Home className="h-4 w-4 inline mr-1" />
                  {t('Ijara turi', language)} *
                </label>
                <select
                  value={formData.propertyType}
                  onChange={(e) => setFormData(prev => ({ ...prev, propertyType: e.target.value }))}
                  className="input"
                  required
                >
                  <option value="workshop">{t('Ustaxona', language)}</option>
                  <option value="office">{t('Ofis', language)}</option>
                  <option value="warehouse">{t('Omboxona', language)}</option>
                  <option value="land">{t('Yer', language)}</option>
                  <option value="other">{t('Boshqa', language)}</option>
                </select>
              </div>

              {/* Manzil */}
              <div>
                <label className="label">
                  <Home className="h-4 w-4 inline mr-1" />
                  {t('Manzil', language)} *
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="input"
                  placeholder={t('To\'liq manzil...', language)}
                  required
                />
              </div>

              {/* Ijara beruvchi */}
              <div>
                <label className="label">
                  <FileText className="h-4 w-4 inline mr-1" />
                  {t('Ijara beruvchi', language)} *
                </label>
                <input
                  type="text"
                  value={formData.landlord}
                  onChange={(e) => setFormData(prev => ({ ...prev, landlord: e.target.value }))}
                  className="input"
                  placeholder={t('Ijara beruvchi nomi...', language)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Ijara summasi */}
                <div>
                  <label className="label">
                    <DollarSign className="h-4 w-4 inline mr-1" />
                    {t("Ijara summasi (so'm)", language)} *
                  </label>
                  <input
                    type="text"
                    value={formData.amountDisplay}
                    onChange={handleAmountChange}
                    className="input"
                    placeholder="1.000.000"
                    required
                  />
                </div>

                {/* To'lov davri */}
                <div>
                  <label className="label">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    {t("To'lov davri", language)} *
                  </label>
                  <select
                    value={formData.period}
                    onChange={(e) => setFormData(prev => ({ ...prev, period: e.target.value }))}
                    className="input"
                    required
                  >
                    <option value="monthly">{t('Oylik', language)}</option>
                    <option value="quarterly">{t('Choraklik', language)}</option>
                    <option value="yearly">{t('Yillik', language)}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Boshlanish sanasi */}
                <div>
                  <label className="label">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    {t('Boshlanish sanasi', language)}
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="input"
                  />
                </div>

                {/* Tugash sanasi */}
                <div>
                  <label className="label">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    {t('Tugash sanasi', language)}
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="input"
                  />
                </div>
              </div>

              {/* Qo'shimcha ma'lumot */}
              <div>
                <label className="label">
                  <FileText className="h-4 w-4 inline mr-1" />
                  {t('Qo\'shimcha ma\'lumot', language)}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="input"
                  rows={3}
                  placeholder={t('Shartnoma raqami, qo\'shimcha shartlar...', language)}
                />
              </div>

              {/* To'lov usuli */}
              <div>
                <label className="label">
                  <CreditCard className="h-4 w-4 inline mr-1" />
                  {t("To'lov usuli", language)} *
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                  className="input"
                  required
                >
                  <option value="cash">{t('Naqd', language)}</option>
                  <option value="card">{t('Karta', language)}</option>
                </select>
              </div>

              {/* Xulosa */}
              {formData.amount > 0 && (
                <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
                  <h4 className="font-semibold text-green-900 mb-2">{t('Xulosa', language)}</h4>
                  <div className="space-y-1 text-sm text-green-800">
                    <p><strong>{t('Ijara turi', language)}:</strong> {getPropertyTypeText(formData.propertyType)}</p>
                    <p><strong>{t('Summa', language)}:</strong> {formatCurrency(formData.amount)} ({getPeriodText(formData.period)})</p>
                    <p><strong>{t('Manzil', language)}:</strong> {formData.address || t('Kiritilmagan', language)}</p>
                  </div>
                </div>
              )}

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
                  disabled={formData.amount <= 0 || !formData.address.trim() || !formData.landlord.trim()}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("Ijara to'lovini qo'shish", language)}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RentExpenseModal;
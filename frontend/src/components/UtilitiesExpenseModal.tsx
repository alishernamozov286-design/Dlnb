import React, { useState } from 'react';
import { X, Zap, FileText, CreditCard, Plus, Minus } from 'lucide-react';
import { formatNumber, parseFormattedNumber, formatCurrency } from '@/lib/utils';
import { t } from '@/lib/transliteration';

interface UtilitiesExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
  category: any;
}

interface UtilityItem {
  id: string;
  type: string;
  provider: string;
  amount: number;
  amountDisplay: string;
  accountNumber: string;
  previousReading?: number;
  currentReading?: number;
  consumption?: number;
}

const UtilitiesExpenseModal: React.FC<UtilitiesExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  category
}) => {
  const [utilities, setUtilities] = useState<UtilityItem[]>([
    { 
      id: '1', 
      type: 'electricity', 
      provider: '', 
      amount: 0, 
      amountDisplay: '', 
      accountNumber: '',
      previousReading: 0,
      currentReading: 0,
      consumption: 0
    }
  ]);
  const [formData, setFormData] = useState({
    period: new Date().toISOString().slice(0, 7), // YYYY-MM format
    description: '',
    paymentMethod: 'cash' as 'cash' | 'card'
  });

  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  if (!isOpen) return null;

  const getUtilityTypeText = (type: string) => {
    const types: { [key: string]: string } = {
      electricity: t('Elektr', language),
      gas: t('Gaz', language),
      water: t('Suv', language),
      internet: t('Internet', language),
      phone: t('Telefon', language),
      heating: t('Isitish', language),
      other: t('Boshqa', language)
    };
    return types[type] || type;
  };

  const addUtilityRow = () => {
    const newId = (utilities.length + 1).toString();
    setUtilities([...utilities, { 
      id: newId, 
      type: 'electricity', 
      provider: '', 
      amount: 0, 
      amountDisplay: '', 
      accountNumber: '',
      previousReading: 0,
      currentReading: 0,
      consumption: 0
    }]);
  };

  const removeUtilityRow = (id: string) => {
    if (utilities.length > 1) {
      setUtilities(utilities.filter(utility => utility.id !== id));
    }
  };

  const updateUtility = (id: string, field: keyof UtilityItem, value: any) => {
    setUtilities(utilities.map(utility => {
      if (utility.id === id) {
        const updatedUtility = { ...utility, [field]: value };
        
        // Agar previous va current reading o'zgarsa, consumption ni hisoblash
        if (field === 'previousReading' || field === 'currentReading') {
          const prev = field === 'previousReading' ? value : updatedUtility.previousReading || 0;
          const curr = field === 'currentReading' ? value : updatedUtility.currentReading || 0;
          updatedUtility.consumption = Math.max(0, curr - prev);
        }
        
        return updatedUtility;
      }
      return utility;
    }));
  };

  const updateUtilityAmount = (id: string, value: string) => {
    const formatted = formatNumber(value);
    const numericValue = parseFormattedNumber(formatted);
    
    setUtilities(utilities.map(utility => {
      if (utility.id === id) {
        return { ...utility, amountDisplay: formatted, amount: numericValue };
      }
      return utility;
    }));
  };

  const getTotalAmount = () => {
    return utilities.reduce((sum, utility) => sum + utility.amount, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const totalAmount = getTotalAmount();
    if (totalAmount <= 0) {
      alert(t('Kamida bitta kommunal to\'lov qo\'shish kerak', language));
      return;
    }

    // Kommunal to'lovlar ro'yxatini tayyorlash
    const utilitiesDescription = utilities
      .filter(utility => utility.provider.trim() && utility.amount > 0)
      .map(utility => {
        let desc = `${getUtilityTypeText(utility.type)} - ${utility.provider}`;
        if (utility.accountNumber) {
          desc += ` (${t('Hisob raqam', language)}: ${utility.accountNumber})`;
        }
        if (utility.consumption && utility.consumption > 0) {
          desc += ` - ${utility.consumption} ${t('birlik', language)}`;
        }
        desc += ` = ${formatCurrency(utility.amount)}`;
        return desc;
      })
      .join('\n');

    const fullDescription = `${t('Davr', language)}: ${formData.period}\n\n${t('Kommunal to\'lovlar', language)}:\n${utilitiesDescription}${formData.description ? `\n\n${t('Qo\'shimcha ma\'lumot', language)}: ${formData.description}` : ''}`;

    onSuccess({
      amount: totalAmount,
      description: fullDescription,
      paymentMethod: formData.paymentMethod
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-600 to-orange-600 p-6 rounded-t-2xl sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {t(category.nameUz, language)}
                  </h3>
                  <p className="text-yellow-100 text-sm">
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
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Davr */}
              <div>
                <label className="label">
                  <FileText className="h-4 w-4 inline mr-1" />
                  {t('To\'lov davri', language)} *
                </label>
                <input
                  type="month"
                  value={formData.period}
                  onChange={(e) => setFormData(prev => ({ ...prev, period: e.target.value }))}
                  className="input"
                  required
                />
              </div>

              {/* Kommunal to'lovlar ro'yxati */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="label">
                    <Zap className="h-4 w-4 inline mr-1" />
                    {t('Kommunal to\'lovlar ro\'yxati', language)} *
                  </label>
                  <button
                    type="button"
                    onClick={addUtilityRow}
                    className="btn-secondary btn-sm flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    {t('Qo\'shish', language)}
                  </button>
                </div>

                <div className="space-y-4">
                  {utilities.map((utility) => (
                    <div key={utility.id} className="p-4 bg-gray-50 rounded-lg border">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        {/* Tur */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('Tur', language)} *
                          </label>
                          <select
                            value={utility.type}
                            onChange={(e) => updateUtility(utility.id, 'type', e.target.value)}
                            className="input"
                            required
                          >
                            <option value="electricity">{t('Elektr', language)}</option>
                            <option value="gas">{t('Gaz', language)}</option>
                            <option value="water">{t('Suv', language)}</option>
                            <option value="internet">{t('Internet', language)}</option>
                            <option value="phone">{t('Telefon', language)}</option>
                            <option value="heating">{t('Isitish', language)}</option>
                            <option value="other">{t('Boshqa', language)}</option>
                          </select>
                        </div>

                        {/* Provayder */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('Provayder', language)} *
                          </label>
                          <input
                            type="text"
                            value={utility.provider}
                            onChange={(e) => updateUtility(utility.id, 'provider', e.target.value)}
                            className="input"
                            placeholder={t('Tashkilot nomi...', language)}
                            required
                          />
                        </div>

                        {/* Hisob raqam */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('Hisob raqam', language)}
                          </label>
                          <input
                            type="text"
                            value={utility.accountNumber}
                            onChange={(e) => updateUtility(utility.id, 'accountNumber', e.target.value)}
                            className="input"
                            placeholder={t('Hisob raqami...', language)}
                          />
                        </div>

                        {/* Summa */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('Summa', language)} *
                          </label>
                          <input
                            type="text"
                            value={utility.amountDisplay}
                            onChange={(e) => updateUtilityAmount(utility.id, e.target.value)}
                            className="input"
                            placeholder="100.000"
                            required
                          />
                        </div>
                      </div>

                      {/* Hisoblagich ko'rsatkichlari (elektr va gaz uchun) */}
                      {(utility.type === 'electricity' || utility.type === 'gas' || utility.type === 'water') && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {t('Oldingi ko\'rsatkich', language)}
                            </label>
                            <input
                              type="number"
                              value={utility.previousReading || ''}
                              onChange={(e) => updateUtility(utility.id, 'previousReading', Number(e.target.value))}
                              className="input"
                              placeholder="0"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {t('Hozirgi ko\'rsatkich', language)}
                            </label>
                            <input
                              type="number"
                              value={utility.currentReading || ''}
                              onChange={(e) => updateUtility(utility.id, 'currentReading', Number(e.target.value))}
                              className="input"
                              placeholder="0"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {t('Sarflangan', language)}
                            </label>
                            <div className="input bg-gray-100 text-gray-700 font-semibold">
                              {utility.consumption || 0} {t('birlik', language)}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* O'chirish tugmasi */}
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeUtilityRow(utility.id)}
                          disabled={utilities.length === 1}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Jami summa */}
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-yellow-900">{t('Jami summa', language)}:</span>
                    <span className="text-2xl font-bold text-yellow-600">
                      {formatCurrency(getTotalAmount())}
                    </span>
                  </div>
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
                  placeholder={t('Qo\'shimcha izoh...', language)}
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
                  disabled={getTotalAmount() <= 0}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("Kommunal to'lovlarni qo'shish", language)}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UtilitiesExpenseModal;
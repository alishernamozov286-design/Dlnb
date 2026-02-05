import React, { useState } from 'react';
import { X, Users, CreditCard, DollarSign } from 'lucide-react';
import { formatNumber, parseFormattedNumber, formatCurrency } from '@/lib/utils';
import { t } from '@/lib/transliteration';
import { useUsers } from '@/hooks/useUsers';

interface SalaryExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
  category: any;
}

interface EmployeeSalary {
  id: string;
  userId?: string;
  name: string;
  baseSalary: number;
  baseSalaryDisplay: string;
  totalSalary: number;
}

const SalaryExpenseModal: React.FC<SalaryExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  category
}) => {
  const [employee, setEmployee] = useState<EmployeeSalary>({
    id: '1',
    userId: '',
    name: '',
    baseSalary: 0,
    baseSalaryDisplay: '',
    totalSalary: 0
  });
  
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');

  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  const { data: usersData, isLoading: apprenticesLoading } = useUsers();
  const apprentices = usersData?.users || [];

  if (!isOpen) return null;

  // Shogirdni tanlash
  const handleApprenticeSelect = (userId: string) => {
    const selectedApprentice = apprentices.find((app: any) => app._id === userId);
    
    if (selectedApprentice) {
      const earnings = selectedApprentice.earnings || 0;
      const formatted = formatNumber(earnings.toString());
      
      setEmployee({
        id: '1',
        userId: selectedApprentice._id,
        name: selectedApprentice.name,
        baseSalary: earnings,
        baseSalaryDisplay: formatted,
        totalSalary: earnings
      });
    }
  };

  const updateEmployeeAmount = (value: string) => {
    const formatted = formatNumber(value);
    const numericValue = parseFormattedNumber(formatted);
    
    setEmployee({
      ...employee,
      baseSalary: numericValue,
      baseSalaryDisplay: formatted,
      totalSalary: numericValue
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (employee.totalSalary <= 0) {
      alert(t('Maosh summasi 0 dan katta bo\'lishi kerak', language));
      return;
    }

    if (!employee.name.trim()) {
      alert(t('Xodim ismini kiriting', language));
      return;
    }

    if (!employee.userId) {
      alert(t('Shogirdni tanlang', language));
      return;
    }
    
    // Agar shogird tanlangan bo'lsa va to'lov summasi uning daromadidan katta bo'lsa
    const selectedApprentice = apprentices.find((app: any) => app._id === employee.userId);
    if (selectedApprentice && employee.totalSalary > selectedApprentice.earnings) {
      const confirmed = window.confirm(
        t('To\'lov summasi shogirdning daromadidan ko\'p. Davom etasizmi?', language)
      );
      if (!confirmed) {
        return;
      }
    }

    const fullDescription = `${t('Xodim', language)}: ${employee.name}
${t('Maosh', language)}: ${formatCurrency(employee.totalSalary)}`;

    await onSuccess({
      amount: employee.totalSalary,
      description: fullDescription,
      paymentMethod: paymentMethod,
      apprenticeId: employee.userId // Shogird ID sini yuborish
    });
  };

  return (
    <div className="fixed inset-0 z-[10000] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {t(category.nameUz, language)}
                  </h3>
                  <p className="text-purple-100 text-sm">
                    {t('Shogird maoshini to\'lash', language)}
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
              {/* Shogird tanlash */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="h-4 w-4 inline mr-1" />
                  {t('Shogirdni tanlang', language)} *
                </label>
                <select
                  value={employee.userId || ''}
                  onChange={(e) => handleApprenticeSelect(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 transition-all"
                  disabled={apprenticesLoading}
                  required
                >
                  <option value="">{t('Tanlang...', language)}</option>
                  {apprentices.map((apprentice: any) => (
                    <option key={apprentice._id} value={apprentice._id}>
                      {apprentice.name} - {formatCurrency(apprentice.earnings || 0)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Xodim ismi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('Xodim ismi', language)} *
                </label>
                <input
                  type="text"
                  value={employee.name}
                  onChange={(e) => setEmployee({ ...employee, name: e.target.value })}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-purple-500 transition-all ${
                    employee.userId ? 'bg-gray-100 border-gray-200' : 'border-gray-200'
                  }`}
                  placeholder={t('To\'liq ism...', language)}
                  required
                  readOnly={!!employee.userId}
                />
              </div>

              {/* Maosh summasi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  {t('Maosh summasi', language)} *
                </label>
                <input
                  type="text"
                  value={employee.baseSalaryDisplay}
                  onChange={(e) => updateEmployeeAmount(e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-all text-lg font-semibold ${
                    employee.userId 
                      ? 'bg-gray-100 border-gray-300 text-gray-700' 
                      : 'border-gray-200 focus:border-purple-500'
                  }`}
                  placeholder="1,000,000"
                  required
                />
                {employee.userId && (
                  <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {t('Shogirdning tasdiqlangan puli', language)}: {formatCurrency(employee.baseSalary)}
                  </p>
                )}
                {employee.userId && employee.totalSalary > employee.baseSalary && (
                  <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                    ⚠️ {t('To\'lov summasi shogirdning daromadidan ko\'p', language)}
                  </p>
                )}
              </div>

              {/* To'lov usuli */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CreditCard className="h-4 w-4 inline mr-1" />
                  {t("To'lov usuli", language)} *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'card')}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 transition-all"
                  required
                >
                  <option value="cash">{t('Naqd', language)}</option>
                  <option value="card">{t('Karta', language)}</option>
                </select>
              </div>

              {/* Jami summa */}
              <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-200">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-purple-900">{t('Jami to\'lov summasi', language)}:</span>
                  <span className="text-2xl font-bold text-purple-600">
                    {formatCurrency(employee.totalSalary)}
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  {t('Bekor qilish', language)}
                </button>
                <button
                  type="submit"
                  disabled={employee.totalSalary <= 0}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-lg"
                >
                  {t("Maosh to'lovini qo'shish", language)}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalaryExpenseModal;

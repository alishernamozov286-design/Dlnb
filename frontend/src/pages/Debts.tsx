import React, { useState } from 'react';
import { useDebts } from '@/hooks/useDebts';
import { useDebtSummary } from '@/hooks/useDebts';
import EditDebtModal from '@/components/EditDebtModal';
import DeleteDebtModal from '@/components/DeleteDebtModal';
import { DollarSign, TrendingUp, TrendingDown, Calendar, Phone, Eye, Edit, Trash2, X, FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Debt } from '@/types';
import { t } from '@/lib/transliteration';

const Debts: React.FC = () => {
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // localStorage'dan tilni o'qish
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  // Hook - avtomatik online/offline rejimni boshqaradi
  const { data: debtsData, isLoading } = useDebts({ 
    type: typeFilter, 
    status: statusFilter 
  });
  const allDebts = debtsData?.debts || [];
  const { data: debtSummary, isLoading: summaryLoading } = useDebtSummary();

  // Faqat to'lanmagan va qisman to'langan qarzlarni ko'rsatish
  const debts = allDebts.filter((debt: Debt) => debt.status !== 'paid');

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending': 
        return { 
          bg: 'bg-gradient-to-r from-amber-50 to-yellow-50', 
          text: 'text-amber-700',
          border: 'border-amber-200',
          dot: 'bg-amber-500'
        };
      case 'partial': 
        return { 
          bg: 'bg-gradient-to-r from-blue-50 to-cyan-50', 
          text: 'text-blue-700',
          border: 'border-blue-200',
          dot: 'bg-blue-500'
        };
      case 'paid': 
        return { 
          bg: 'bg-gradient-to-r from-blue-50 to-cyan-50', 
          text: 'text-blue-700',
          border: 'border-blue-200',
          dot: 'bg-blue-500'
        };
      default: 
        return { 
          bg: 'bg-gray-50', 
          text: 'text-gray-700',
          border: 'border-gray-200',
          dot: 'bg-gray-500'
        };
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return t('To\'lanmagan', language);
      case 'partial': return t('Qisman to\'langan', language);
      case 'paid': return t('To\'langan', language);
      default: return status;
    }
  };

  const getTypeText = (type: string) => {
    return type === 'receivable' ? t('Bizga qarzi bor', language) : t('Bizning qarzimiz', language);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uz-UZ');
  };

  const DebtDetailModal: React.FC<{ debt: Debt }> = ({ debt }) => {
    const isReceivable = debt.type === 'receivable';
    const remainingAmount = debt.amount - debt.paidAmount;
    const progressPercentage = (debt.paidAmount / debt.amount) * 100;
    const statusConfig = getStatusConfig(debt.status);

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedDebt(null)} />
          
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden">
            {/* Header with Gradient */}
            <div className={`relative ${isReceivable 
              ? 'bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-700' 
              : 'bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700'
            } p-8`}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-24 -mb-24"></div>
              
              <div className="relative flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="bg-white/20 backdrop-blur-xl p-4 rounded-2xl shadow-lg">
                    {isReceivable ? (
                      <TrendingUp className="h-8 w-8 text-white" />
                    ) : (
                      <TrendingDown className="h-8 w-8 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-3xl font-bold text-white mb-2">{debt.creditorName}</h3>
                    <p className={`text-lg ${isReceivable ? 'text-blue-100' : 'text-indigo-100'}`}>
                      {getTypeText(debt.type)}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedDebt(null)}
                  className="text-white/80 hover:text-white hover:bg-white/20 rounded-xl p-2 transition-all"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Status Badge */}
              <div className="relative mt-6">
                <div className={`inline-flex ${statusConfig.bg} ${statusConfig.border} border-2 px-4 py-2 rounded-full items-center space-x-2 shadow-lg`}>
                  <div className={`w-2.5 h-2.5 rounded-full ${statusConfig.dot} animate-pulse`}></div>
                  <span className={`text-sm font-bold ${statusConfig.text}`}>
                    {getStatusText(debt.status)}
                  </span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6">
              {/* Amount Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">{t('Umumiy summa', language)}</span>
                    <DollarSign className="h-5 w-5 text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(debt.amount)}</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-5 border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">{t("To'langan", language)}</span>
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(debt.paidAmount)}</p>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-5 border border-red-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">{t('Qolgan', language)}</span>
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  </div>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(remainingAmount)}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-700">{t("To'lov jarayoni", language)}</span>
                  <span className="text-sm font-bold text-gray-900">{progressPercentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      progressPercentage === 100 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                    }`}
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact Info */}
                {(debt.creditorPhone || debt.dueDate) && (
                  <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-2xl p-5 border border-gray-100">
                    <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">{t("Qo'shimcha ma'lumot", language)}</h4>
                    <div className="space-y-3">
                      {debt.creditorPhone && (
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <Phone className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">{t('Telefon', language)}</p>
                            <p className="font-semibold text-gray-900">{debt.creditorPhone}</p>
                          </div>
                        </div>
                      )}
                      {debt.dueDate && (
                        <div className="flex items-center space-x-3">
                          <div className="bg-purple-100 p-2 rounded-lg">
                            <Calendar className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">{t("To'lov muddati", language)}</p>
                            <p className="font-semibold text-gray-900">{formatDate(debt.dueDate)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Description */}
                {debt.description && (
                  <div className="bg-gradient-to-br from-gray-50 to-purple-50/30 rounded-2xl p-5 border border-gray-100">
                    <h4 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      {t('Izoh', language)}
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed">{debt.description}</p>
                  </div>
                )}
              </div>

              {/* Payment History */}
              {debt.paymentHistory && debt.paymentHistory.length > 0 && (
                <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-2xl p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      {t("To'lov tarixi", language)}
                    </h4>
                    <span className="text-xs font-semibold text-gray-500 bg-white px-3 py-1 rounded-full">
                      {debt.paymentHistory.length} {t("ta to'lov", language)}
                    </span>
                  </div>
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {debt.paymentHistory.map((payment, index) => (
                      <div key={index} className="bg-white rounded-xl p-4 border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="bg-blue-100 p-2 rounded-lg">
                              <DollarSign className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-lg font-bold text-gray-900">{formatCurrency(payment.amount)}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Calendar className="h-3 w-3 text-gray-400" />
                                <p className="text-xs text-gray-500">{formatDate(payment.date)}</p>
                              </div>
                              {payment.notes && (
                                <p className="text-sm text-gray-600 mt-2 italic">{payment.notes}</p>
                              )}
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                            #{debt.paymentHistory.length - index}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="bg-gray-50 border-t border-gray-200 px-8 py-5 flex items-center justify-end space-x-3">
              <button
                onClick={() => setSelectedDebt(null)}
                className="px-6 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
              >
                {t('Yopish', language)}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-indigo-50/20 p-2 sm:p-6 pb-20">
      <div className="max-w-7xl mx-auto space-y-3 sm:space-y-8">
        {/* Mobile-First Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-xl sm:rounded-3xl shadow-2xl p-3 sm:p-6 lg:p-8">
          <div className="absolute inset-0 bg-grid-white/10"></div>
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
          
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex items-center space-x-3 sm:space-x-6">
              <div className="bg-white/20 backdrop-blur-xl p-2.5 sm:p-4 rounded-lg sm:rounded-2xl shadow-lg">
                <DollarSign className="h-6 w-6 sm:h-10 sm:w-10 text-white" />
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 tracking-tight">{t("Qarz daftarchasi", language)}</h1>
                <p className="text-blue-100 text-xs sm:text-base lg:text-lg">
                  {debts.length} ta qarz mavjud
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile-Optimized Summary Cards */}
        <div className="grid grid-cols-1 gap-3 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Receivables Card */}
          <div className="group relative bg-white rounded-lg sm:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full -mr-10 sm:-mr-16 -mt-10 sm:-mt-16 opacity-50"></div>
            <div className="relative p-3 sm:p-6">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-lg">
                  <TrendingUp className="h-4 w-4 sm:h-7 sm:w-7 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">{t("Bizga qarzi", language)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {(debtSummary as any)?.receivables?.count || 0} {t("mijoz", language)}
                  </p>
                </div>
              </div>
              <div className="mt-2 sm:mt-4">
                <p className="text-lg sm:text-3xl font-bold text-gray-900">
                  {summaryLoading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    formatCurrency((debtSummary as any)?.receivables?.remaining || 0)
                  )}
                </p>
                <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Jami:</span>
                    <span className="font-medium text-gray-700">
                      {formatCurrency((debtSummary as any)?.receivables?.total || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payables Card */}
          <div className="group relative bg-white rounded-lg sm:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-indigo-200 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full -mr-10 sm:-mr-16 -mt-10 sm:-mt-16 opacity-50"></div>
            <div className="relative p-3 sm:p-6">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-lg">
                  <TrendingDown className="h-4 w-4 sm:h-7 sm:w-7 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">{t("Bizning qarzi", language)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {(debtSummary as any)?.payables?.count || 0} {t("ta'minotchi", language)}
                  </p>
                </div>
              </div>
              <div className="mt-2 sm:mt-4">
                <p className="text-lg sm:text-3xl font-bold text-gray-900">
                  {summaryLoading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    formatCurrency((debtSummary as any)?.payables?.remaining || 0)
                  )}
                </p>
                <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Jami:</span>
                    <span className="font-medium text-gray-700">
                      {formatCurrency((debtSummary as any)?.payables?.total || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Net Position Card */}
          <div className="group relative bg-white rounded-lg sm:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-sky-200 hover:-translate-y-1 sm:col-span-2 lg:col-span-1">
            <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-br from-sky-100 to-blue-100 rounded-full -mr-10 sm:-mr-16 -mt-10 sm:-mt-16 opacity-50"></div>
            <div className="relative p-3 sm:p-6">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <div className="bg-gradient-to-br from-sky-500 to-blue-600 p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-lg">
                  <DollarSign className="h-4 w-4 sm:h-7 sm:w-7 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-sky-600 uppercase tracking-wide">{t("Holat", language)}</p>
                  <p className={`text-xs font-medium mt-1 ${
                    ((debtSummary as any)?.netPosition || 0) >= 0 ? 'text-blue-600' : 'text-indigo-600'
                  }`}>
                    {((debtSummary as any)?.netPosition || 0) >= 0 ? t('✓ Ijobiy', language) : t('⚠ Salbiy', language)}
                  </p>
                </div>
              </div>
              <div className="mt-2 sm:mt-4">
                <p className={`text-lg sm:text-3xl font-bold ${
                  ((debtSummary as any)?.netPosition || 0) >= 0 ? 'text-blue-600' : 'text-indigo-600'
                }`}>
                  {summaryLoading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    formatCurrency((debtSummary as any)?.netPosition || 0)
                  )}
                </p>
                <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    {((debtSummary as any)?.netPosition || 0) >= 0 
                      ? t('Qabul qilinadigan qarzlar ko\'proq', language)
                      : t('To\'lanadigan qarzlar ko\'proq', language)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile-First Filters */}
        <div className="bg-white rounded-lg sm:rounded-2xl shadow-lg border border-gray-100 p-3 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="flex-1 px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm font-medium appearance-none cursor-pointer"
            >
              <option value="">{t("Barcha turlar", language)}</option>
              <option value="receivable">{t("Bizga qarzi bor", language)}</option>
              <option value="payable">{t("Bizning qarzimiz", language)}</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm font-medium appearance-none cursor-pointer"
            >
              <option value="">{t("Barcha holatlar", language)}</option>
              <option value="pending">{t("To'lanmagan", language)}</option>
              <option value="partial">{t("Qisman to'langan", language)}</option>
              <option value="paid">{t("To'langan", language)}</option>
            </select>
          </div>
        </div>

        {/* Debts List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-blue-200"></div>
              <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-t-blue-600 absolute top-0 left-0"></div>
            </div>
            <p className="mt-4 sm:mt-6 text-gray-600 font-medium text-sm sm:text-base">{t("Qarzlar yuklanmoqda...", language)}</p>
          </div>
        ) : debts.length === 0 ? (
          <div className="bg-white rounded-lg sm:rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-16 text-center">
            <div className="max-w-md mx-auto">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-full w-16 h-16 sm:w-24 sm:h-24 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <DollarSign className="h-8 w-8 sm:h-12 sm:w-12 text-blue-600" />
              </div>
              <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">{t("Qarzlar topilmadi", language)}</h3>
              <p className="text-gray-600 mb-4 sm:mb-8 text-sm sm:text-base px-4 sm:px-0">
                {t("Qarzlar avtomatik ravishda mashina to'lovi qisman to'langanda yaratiladi.", language)}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {debts.map((debt: Debt) => {
              const statusConfig = getStatusConfig(debt.status);
              const isReceivable = debt.type === 'receivable';
              const remainingAmount = debt.amount - debt.paidAmount;
              const progressPercentage = (debt.paidAmount / debt.amount) * 100;

              return (
                <div
                  key={debt._id}
                  className="group relative bg-white rounded-lg sm:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200 hover:-translate-y-1"
                >
                  {/* Card Header */}
                  <div className={`${isReceivable 
                    ? 'bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-700' 
                    : 'bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700'
                  } p-3 sm:p-6 pb-4 sm:pb-8`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start space-x-2 sm:space-x-4 flex-1 min-w-0">
                        <div className="bg-white/20 backdrop-blur-xl p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-lg flex-shrink-0">
                          {isReceivable ? (
                            <TrendingUp className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                          ) : (
                            <TrendingDown className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-xl font-bold text-white mb-1 break-words">
                            {debt.creditorName}
                          </h3>
                          <p className={`text-xs sm:text-sm ${isReceivable ? 'text-blue-100' : 'text-indigo-100'}`}>
                            {getTypeText(debt.type)}
                          </p>
                        </div>
                      </div>
                      {/* Status Badge - Extra Compact */}
                      <div className={`${statusConfig.bg} ${statusConfig.border} border px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md flex items-center space-x-1 shadow-sm flex-shrink-0 self-start`}>
                        <div className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${statusConfig.dot} animate-pulse`}></div>
                        <span className={`text-[9px] sm:text-[10px] font-bold ${statusConfig.text} uppercase tracking-wide whitespace-nowrap`}>
                          {getStatusText(debt.status)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-3 sm:p-6 space-y-2 sm:space-y-4">
                    {/* Amount Info */}
                    <div className="bg-gradient-to-r from-gray-50 to-blue-50/50 rounded-lg sm:rounded-xl p-2.5 sm:p-4 border border-gray-100">
                      <div className="space-y-1.5 sm:space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-500 uppercase">{t("Umumiy", language)}</span>
                          <span className="text-sm sm:text-base font-bold text-gray-900">{formatCurrency(debt.amount)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-500 uppercase">{t("To'langan", language)}</span>
                          <span className="text-sm sm:text-base font-bold text-blue-600">{formatCurrency(debt.paidAmount)}</span>
                        </div>
                        <div className="pt-1.5 sm:pt-2 border-t border-gray-200">
                          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase">{t("Qolgan", language)}</span>
                            <span className="text-sm sm:text-lg font-bold text-red-600">{formatCurrency(remainingAmount)}</span>
                          </div>
                          {/* Progress Bar */}
                          <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                progressPercentage === 100 ? 'bg-blue-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${progressPercentage}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 text-right">{progressPercentage.toFixed(0)}% {t("to'langan", language)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Contact & Date Info */}
                    <div className="space-y-1.5 sm:space-y-2">
                      {debt.creditorPhone && (
                        <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                          <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                          <span className="font-medium truncate">{debt.creditorPhone}</span>
                        </div>
                      )}
                      {debt.dueDate && (
                        <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                          <span>{t("Muddat:", language)} <span className="font-medium">{formatDate(debt.dueDate)}</span></span>
                        </div>
                      )}
                      {debt.paymentHistory && debt.paymentHistory.length > 0 && (
                        <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                          <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                          <span>{debt.paymentHistory.length} {t("ta to'lov tarixi", language)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer - Action Buttons */}
                  <div className="px-3 sm:px-6 pb-3 sm:pb-6">
                    <div className="flex items-stretch gap-2 pt-2 sm:pt-4 border-t border-gray-100">
                      <button 
                        onClick={() => setSelectedDebt(debt)}
                        className="flex-1 flex items-center justify-center space-x-1 sm:space-x-2 px-3 py-2 sm:py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg sm:rounded-xl transition-all duration-200 font-medium group"
                        title={t("Ko'rish", language)}
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 group-hover:scale-110 transition-transform" />
                        <span className="text-xs sm:text-sm">{t("Ko'rish", language)}</span>
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedDebt(debt);
                          setIsEditModalOpen(true);
                        }}
                        className="p-2 sm:p-2.5 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg sm:rounded-xl transition-all duration-200"
                        title={t("Tahrirlash", language)}
                      >
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedDebt(debt);
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-2 sm:p-2.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg sm:rounded-xl transition-all duration-200"
                        title={t("O'chirish", language)}
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedDebt && !isEditModalOpen && !isDeleteModalOpen && <DebtDetailModal debt={selectedDebt} />}
      {selectedDebt && (
        <>
          <EditDebtModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedDebt(null);
            }}
            debt={selectedDebt}
          />
          <DeleteDebtModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setSelectedDebt(null);
            }}
            debt={selectedDebt}
          />
        </>
      )}
    </div>
  );
};

export default Debts;
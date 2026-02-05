import React, { memo, useMemo, useCallback, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTaskStats } from '@/hooks/useTasks';
import { useDebtSummary } from '@/hooks/useDebts';
import { useApprentices } from '@/hooks/useUsers';
import { Link } from 'react-router-dom';
import { 
  CheckSquare, 
  Clock, 
  AlertCircle, 
  CheckCircle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Car,
  Plus,
  Eye,
  BarChart3,
  Calendar,
  Star,
  Zap,
  Wrench,
  Settings
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { t } from '@/lib/transliteration';
import CreateServiceModal from '@/components/CreateServiceModal';

const MasterDashboard: React.FC = memo(() => {
  const { user } = useAuth();
  const { data: taskStats, isLoading: taskStatsLoading } = useTaskStats();
  const { data: debtSummary, isLoading: debtSummaryLoading } = useDebtSummary();
  const { data: apprenticesData, isLoading: apprenticesLoading } = useApprentices();
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);

  // localStorage'dan tilni o'qish - faqat bir marta
  const language = useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  // Task statistikalarini memoize qilish
  const getTaskStatByStatus = useCallback((status: string) => {
    return (taskStats as any)?.stats?.find((stat: any) => stat._id === status) || { count: 0, totalEstimatedHours: 0, totalActualHours: 0 };
  }, [taskStats]);

  // Task stats ma'lumotlarini memoize qilish
  const taskStatsData = useMemo(() => {
    const assignedTasks = getTaskStatByStatus('assigned');
    const inProgressTasks = getTaskStatByStatus('in-progress');
    const completedTasks = getTaskStatByStatus('completed');
    const approvedTasks = getTaskStatByStatus('approved');

    return [
      {
        name: t('Tayinlangan vazifalar', language),
        value: assignedTasks.count,
        icon: CheckSquare,
        bgColor: 'bg-gradient-to-br from-blue-500 to-blue-600',
        change: '+12%',
        changeType: 'positive' as const
      },
      {
        name: t('Jarayonda', language),
        value: inProgressTasks.count,
        icon: Clock,
        bgColor: 'bg-gradient-to-br from-amber-500 to-orange-500',
        change: '+8%',
        changeType: 'positive' as const
      },
      {
        name: t('Bajarilgan', language),
        value: completedTasks.count,
        icon: AlertCircle,
        bgColor: 'bg-gradient-to-br from-orange-500 to-red-500',
        change: '+15%',
        changeType: 'positive' as const
      },
      {
        name: t('Tasdiqlangan', language),
        value: approvedTasks.count,
        icon: CheckCircle,
        bgColor: 'bg-gradient-to-br from-green-500 to-emerald-600',
        change: '+22%',
        changeType: 'positive' as const
      },
    ];
  }, [getTaskStatByStatus, language]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 p-3 sm:p-4 md:p-6 animate-fade-in">
        {/* Header Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 rounded-2xl sm:rounded-3xl"></div>
          <div className="relative card-gradient p-4 sm:p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  {t("Ustoz paneli", language)}
                </h1>
                <div className="text-base sm:text-lg lg:text-xl text-gray-600 mt-1 sm:mt-2">
                  {t("Xush kelibsiz", language)}, <span className="font-semibold text-blue-600">{user?.name}</span>
                </div>
                <div className="text-sm sm:text-base text-gray-500 mt-1 hidden sm:block">
                  {t("Ustaxonani boshqarish va shogirdlar faoliyatini kuzatish.", language)}
                </div>
              </div>
              <div className="flex items-center space-x-3 sm:space-x-4 self-end sm:self-auto">
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg">
                  {user?.name?.charAt(0)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Task Statistics */}
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {taskStatsData.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={stat.name} className="group animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="card p-4 sm:p-5 md:p-6 hover:scale-105 transition-all duration-300 cursor-pointer relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className={`icon-container ${stat.bgColor} text-white shadow-lg`}>
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                      <div className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        stat.changeType === 'positive' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {stat.change}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-medium text-gray-600 mb-1">{stat.name}</div>
                      <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                        {taskStatsLoading ? (
                          <div className="animate-pulse bg-gray-200 h-6 sm:h-8 w-12 sm:w-16 rounded"></div>
                        ) : (
                          stat.value
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Debt Summary - Qarz daftarchasi */}
        <div className="card-gradient p-4 sm:p-6 md:p-8 animate-slide-up">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
              <DollarSign className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600 mr-2 sm:mr-3" />
              {t("Qarz daftarchasi", language)}
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6 lg:grid-cols-3">
            <div className="card p-4 sm:p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:shadow-glow-green transition-all duration-300">
              <div className="flex items-center">
                <div className="icon-container bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg flex-shrink-0">
                  <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                  <div className="text-xs sm:text-sm font-semibold text-green-700">{t("Bizga qarzi bor", language)}</div>
                  <div className="text-xl sm:text-2xl font-bold text-green-900 truncate">
                    {debtSummaryLoading ? (
                      <div className="animate-pulse bg-green-200 h-6 sm:h-8 w-20 sm:w-24 rounded"></div>
                    ) : (
                      formatCurrency((debtSummary as any)?.receivables?.remaining || 0)
                    )}
                  </div>
                  <div className="text-xs text-green-600 font-medium">
                    {(debtSummary as any)?.receivables?.count || 0} {t("mijoz", language)}
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-4 sm:p-6 bg-gradient-to-br from-red-50 to-pink-50 border-red-200 hover:shadow-glow-red transition-all duration-300">
              <div className="flex items-center">
                <div className="icon-container bg-gradient-to-br from-red-500 to-pink-600 text-white shadow-lg flex-shrink-0">
                  <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                  <div className="text-xs sm:text-sm font-semibold text-red-700">{t("Bizning qarzimiz", language)}</div>
                  <div className="text-xl sm:text-2xl font-bold text-red-900 truncate">
                    {debtSummaryLoading ? (
                      <div className="animate-pulse bg-red-200 h-6 sm:h-8 w-20 sm:w-24 rounded"></div>
                    ) : (
                      formatCurrency((debtSummary as any)?.payables?.remaining || 0)
                    )}
                  </div>
                  <div className="text-xs text-red-600 font-medium">
                    {(debtSummary as any)?.payables?.count || 0} {t("ta'minotchi", language)}
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 hover:shadow-glow transition-all duration-300">
              <div className="flex items-center">
                <div className="icon-container bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg flex-shrink-0">
                  <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                  <div className="text-xs sm:text-sm font-semibold text-blue-700">{t("Umumiy holat", language)}</div>
                  <div className={`text-xl sm:text-2xl font-bold truncate ${
                    ((debtSummary as any)?.netPosition || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {debtSummaryLoading ? (
                      <div className="animate-pulse bg-blue-200 h-6 sm:h-8 w-20 sm:w-24 rounded"></div>
                    ) : (
                      formatCurrency((debtSummary as any)?.netPosition || 0)
                    )}
                  </div>
                  <div className={`text-xs font-medium ${
                    ((debtSummary as any)?.netPosition || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {((debtSummary as any)?.netPosition || 0) >= 0 ? t('Ijobiy holat', language) : t('Salbiy holat', language)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:gap-8 lg:grid-cols-2">
          {/* Shogirdlar ro'yxati */}
          <div className="card-gradient p-4 sm:p-5 md:p-6 animate-slide-up">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mr-2 sm:mr-3" />
                {t("Shogirdlar ro'yxati", language)}
              </h3>
              <Link to="/app/master/apprentices" className="btn-secondary btn-sm w-full sm:w-auto justify-center">
                <Eye className="h-4 w-4 mr-2" />
                {t("Barchasini ko'rish", language)}
              </Link>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {apprenticesLoading ? (
                <div className="space-y-3 sm:space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="card p-3 sm:p-4 animate-pulse">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gray-200 rounded-xl flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <div className="h-3 sm:h-4 bg-gray-200 rounded w-24 sm:w-32 mb-2"></div>
                          <div className="h-2 sm:h-3 bg-gray-200 rounded w-16 sm:w-24"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (apprenticesData as any)?.users && (apprenticesData as any).users.length > 0 ? (
                (apprenticesData as any).users.slice(0, 3).map((apprentice: any, index: number) => (
                  <div key={apprentice._id} className="card p-3 sm:p-4 hover:shadow-lg transition-all duration-300 group">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                        <div className={`h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br ${
                          index % 3 === 0 ? 'from-blue-500 to-indigo-600' :
                          index % 3 === 1 ? 'from-green-500 to-emerald-600' :
                          'from-purple-500 to-pink-600'
                        } rounded-xl flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0`}>
                          {apprentice.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 text-sm sm:text-base truncate">{apprentice.name}</div>
                          <div className="text-xs sm:text-sm text-gray-500 truncate">@{apprentice.username}</div>
                          <div className="flex items-center mt-1">
                            <Star className="h-3 w-3 text-yellow-500 mr-1 flex-shrink-0" />
                            <span className="text-xs text-gray-600">{t("Yangi shogird", language)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 flex-shrink-0">
                        <div className="badge badge-success text-xs">{t("Faol", language)}</div>
                        <Link 
                          to="/master/apprentices" 
                          className="btn-primary btn-sm text-xs hidden sm:block transition-all"
                        >
                          {t("Ko'rish", language)}
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 sm:py-8">
                  <Users className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mb-3 sm:mb-4" />
                  <div className="text-sm sm:text-base text-gray-500 mb-3 sm:mb-4">{t("Hozircha shogirdlar yo'q", language)}</div>
                  <Link to="/master/apprentices" className="btn-primary btn-sm">
                    <Plus className="h-4 w-4 mr-2" />
                    {t("Birinchi shogirdni qo'shish", language)}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Tezkor amallar */}
          <div className="card-gradient p-4 sm:p-5 md:p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
                <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mr-2 sm:mr-3" />
                {t("Tezkor amallar", language)}
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              <button 
                onClick={() => setIsServiceModalOpen(true)}
                className="btn-primary flex items-center justify-center group p-3 sm:p-4 text-sm sm:text-base"
              >
                <Settings className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 group-hover:scale-110 transition-transform" />
                {t("Xizmat qo'shish", language)}
              </button>
              <Link to="/app/master/tasks" className="btn-primary flex items-center justify-center group p-3 sm:p-4 text-sm sm:text-base">
                <CheckSquare className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 group-hover:scale-110 transition-transform" />
                {t("Vazifa berish", language)}
              </Link>
              <Link to="/app/master/spare-parts" className="btn-info flex items-center justify-center group p-3 sm:p-4 text-sm sm:text-base">
                <Wrench className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 group-hover:scale-110 transition-transform" />
                {t("Zapchastlar", language)}
              </Link>
              <Link to="/app/master/apprentices" className="btn-success flex items-center justify-center group p-3 sm:p-4 text-sm sm:text-base">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 group-hover:scale-110 transition-transform" />
                {t("Shogirdlar boshqaruvi", language)}
              </Link>
              <Link to="/app/cars" className="btn-warning flex items-center justify-center group p-3 sm:p-4 text-sm sm:text-base">
                <Car className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 group-hover:scale-110 transition-transform" />
                {t("Avtomobillar", language)}
              </Link>
              <Link to="/app/debts" className="btn-secondary flex items-center justify-center group p-3 sm:p-4 text-sm sm:text-base">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 group-hover:scale-110 transition-transform" />
                {t("Qarz daftarchasi", language)}
              </Link>
            </div>
          </div>
        </div>

        {/* So'nggi faoliyat - faqat real ma'lumotlar bo'lsa */}
        {false && ((taskStats as any)?.totalTasks || 0) > 0 && (
          <div className="card-gradient p-4 sm:p-6 md:p-8 animate-slide-up">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center">
              <Calendar className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600 mr-2 sm:mr-3" />
              {t("So'nggi faoliyat", language)}
            </h3>
            <div className="text-center py-6 sm:py-8">
              <Calendar className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mb-3 sm:mb-4" />
              <div className="text-sm sm:text-base text-gray-500">{t("Hozircha faoliyat yo'q", language)}</div>
              <div className="text-xs sm:text-sm text-gray-400 mt-2">
                {t("Vazifalar va amallar bajarilgandan so'ng bu yerda ko'rinadi", language)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Service Modal */}
      <CreateServiceModal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        onSuccess={() => {
          // Refresh services if needed
        }}
      />
    </div>
  );
});

export default MasterDashboard;
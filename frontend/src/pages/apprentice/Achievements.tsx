import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks } from '@/hooks/useTasks';
import { 
  Award, 
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react';
import { t } from '@/lib/transliteration';
import api from '@/lib/api';

interface ApprovedTask {
  _id: string;
  title: string;
  car: {
    make: string;
    carModel: string;
    licensePlate: string;
    ownerName: string;
  };
  earning: number;
  totalPayment: number;
  percentage: number;
  approvedAt: string;
}

interface ApprenticeEarningsData {
  name: string;
  currentMonthEarnings: number;
  totalEarnings: number;
  approvedTasksCount: number;
  approvedTasksEarnings: number;
  approvedTasks: ApprovedTask[];
}

const ApprenticeAchievements: React.FC = () => {
  const { user } = useAuth();
  const { data: tasks } = useTasks();
  const [timeFilter, setTimeFilter] = useState<'today' | 'yesterday' | 'week' | 'month' | 'year' | 'all'>('all');
  const [earningsData, setEarningsData] = useState<ApprenticeEarningsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Backend'dan daromad ma'lumotlarini olish
  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        setLoading(true);
        const response = await api.get('/stats/apprentice/earnings');
        if (response.data.success) {
          setEarningsData(response.data.data);
        }
      } catch (error) {
        console.error('Daromad ma\'lumotlarini olishda xatolik:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
  }, []);

  // localStorage'dan tilni o'qish
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  // Shogird uchun vazifalarni filtrlash
  const allTasks = tasks?.tasks || [];
  const myTasks = allTasks.filter((task: any) => {
    // Eski tizim: assignedTo
    const assignedToId = typeof task.assignedTo === 'object' ? task.assignedTo._id : task.assignedTo;
    if (assignedToId === user?.id) return true;
    
    // Yangi tizim: assignments array ichida tekshirish
    if (task.assignments && task.assignments.length > 0) {
      return task.assignments.some((assignment: any) => {
        const apprenticeId = typeof assignment.apprentice === 'object' 
          ? assignment.apprentice._id 
          : assignment.apprentice;
        return apprenticeId === user?.id;
      });
    }
    
    return false;
  });
  const approvedTasks = myTasks.filter((task: any) => task.status === 'approved');
  const completedTasks = myTasks.filter((task: any) => task.status === 'completed' || task.status === 'approved');

  // Vaqt bo'yicha filtrlash
  const getFilteredTasks = () => {
    if (!earningsData) return [];
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const yearAgo = new Date(today);
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);

    return earningsData.approvedTasks.filter((task) => {
      if (!task.approvedAt) return false;
      const approvedDate = new Date(task.approvedAt);

      switch (timeFilter) {
        case 'today':
          return approvedDate >= today;
        case 'yesterday':
          return approvedDate >= yesterday && approvedDate < today;
        case 'week':
          return approvedDate >= weekAgo;
        case 'month':
          return approvedDate >= monthAgo;
        case 'year':
          return approvedDate >= yearAgo;
        case 'all':
        default:
          return true;
      }
    });
  };

  const filteredTasks = getFilteredTasks();
  
  // Filtrlangan vazifalardan daromad
  const filteredEarnings = filteredTasks.reduce((total, task) => total + (task.earning || 0), 0);

  // Statistikalar
  // Jami ish soatlari - berilgan vazifalarning estimatedHours yig'indisi
  const totalHours = myTasks.reduce((total: number, task: any) => total + (task.estimatedHours || 0), 0);
  
  // Bajarish foizi - berilgan vazifalarning necha foizi bajarilgan
  const completionRate = myTasks.length > 0 ? Math.round((completedTasks.length / myTasks.length) * 100) : 0;

  // Haftalik faoliyat
  const getWeeklyActivity = () => {
    const today = new Date();
    const weekDays = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
    
    // Oxirgi 7 kunni olish
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    return last7Days.map(date => {
      const dayName = weekDays[date.getDay()];
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      // Shu kunda bajarilgan vazifalarni topish
      const dayTasks = approvedTasks.filter((task: any) => {
        if (!task.completedAt) return false;
        const completedDate = new Date(task.completedAt);
        return completedDate >= dayStart && completedDate <= dayEnd;
      });

      const hours = dayTasks.reduce((total: number, task: any) => total + (task.actualHours || 0), 0);
      const maxHours = 10; // Maksimal soat
      const percentage = maxHours > 0 ? Math.min((hours / maxHours) * 100, 100) : 0;

      return {
        day: dayName,
        hours: hours,
        percentage: percentage
      };
    });
  };

  const weeklyActivity = getWeeklyActivity();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('Yuklanmoqda...', language)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-6 p-2 sm:p-0 pb-20">
      {/* Mobile-First Header */}
      <div className="text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('Mening daromadim', language)}</h1>
        <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
          {t('Sizning professional rivojlanishingiz va erishgan yutuqlaringiz.', language)}
        </p>
      </div>

      {/* Mobile-Optimized Statistics Overview */}
      <div className="grid grid-cols-2 gap-2 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center text-center sm:text-left">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-blue-100 mb-2 sm:mb-0">
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div className="sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">{t('Tasdiqlangan', language)}</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{approvedTasks.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center text-center sm:text-left">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-blue-100 mb-2 sm:mb-0">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div className="sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">{t('Ish soatlari', language)}</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalHours}</p>
            </div>
          </div>
        </div>

        <div className="card p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center text-center sm:text-left">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-purple-100 mb-2 sm:mb-0">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
            </div>
            <div className="sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">{t('Bajarish %', language)}</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{completionRate}%</p>
            </div>
          </div>
        </div>

        <div className="card p-3 sm:p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 col-span-2 sm:col-span-2 lg:col-span-1">
          <div className="flex flex-col sm:flex-row items-center text-center sm:text-left">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-blue-500 mb-2 sm:mb-0">
              <Award className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-blue-700">{t('Joriy oylik', language)}</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-900">
                {new Intl.NumberFormat('uz-UZ').format(earningsData?.currentMonthEarnings || 0)}
              </p>
              <p className="text-xs text-blue-600">{t('so\'m', language)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tasdiqlangan pullari va Joriy oylik - Yangi qator */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
        <div className="card p-4 sm:p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-green-500">
              <CheckCircle className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-green-700 mb-1">{t('Tasdiqlangan pullari', language)}</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-900">
                {new Intl.NumberFormat('uz-UZ').format(approvedTasks.reduce((total: number, task: any) => {
                  // Yangi tizim: assignments orqali
                  if (task.assignments && task.assignments.length > 0) {
                    const myAssignment = task.assignments.find((a: any) => {
                      const apprenticeId = typeof a.apprentice === 'object' ? a.apprentice._id : a.apprentice;
                      return apprenticeId === user?.id;
                    });
                    if (myAssignment) {
                      return total + (myAssignment.earning || 0);
                    }
                  }
                  // Eski tizim: apprenticeEarning
                  if (task.apprenticeEarning) {
                    return total + task.apprenticeEarning;
                  }
                  return total;
                }, 0))}
              </p>
              <p className="text-xs text-green-600 mt-1">{t('so\'m (barcha vaqt)', language)}</p>
            </div>
          </div>
        </div>

        <div className="card p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-blue-500">
              <Award className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-blue-700 mb-1">{t('Joriy oylik', language)}</p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-900">
                {new Intl.NumberFormat('uz-UZ').format(earningsData?.currentMonthEarnings || 0)}
              </p>
              <p className="text-xs text-blue-600 mt-1">{t('so\'m', language)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Jami daromad kartasi - yangi */}
      <div className="card p-4 sm:p-6 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Award className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div>
              <p className="text-sm sm:text-base text-blue-100 mb-1">{t('Jami daromad', language)}</p>
              <p className="text-3xl sm:text-4xl font-bold">
                {new Intl.NumberFormat('uz-UZ').format(earningsData?.currentMonthEarnings || 0)}
              </p>
              <p className="text-xs sm:text-sm text-blue-100 mt-1">{t('so\'m (joriy oy)', language)}</p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-2xl font-bold">{earningsData?.approvedTasksCount || 0}</div>
            <div className="text-sm text-blue-100">{t('ta vazifa', language)}</div>
          </div>
        </div>
      </div>

      {/* Tasdiqlangan vazifalar daromadi */}
      <div className="card p-4 sm:p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-xl bg-green-500">
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div>
              <p className="text-sm sm:text-base text-green-700 mb-1">{t('Tasdiqlangan pullari', language)}</p>
              <p className="text-3xl sm:text-4xl font-bold text-green-900">
                {new Intl.NumberFormat('uz-UZ').format(earningsData?.approvedTasksEarnings || 0)}
              </p>
              <p className="text-xs sm:text-sm text-green-600 mt-1">{t('so\'m', language)}</p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-2xl font-bold text-green-900">{earningsData?.approvedTasksCount || 0}</div>
            <div className="text-sm text-green-700">{t('ta vazifa', language)}</div>
          </div>
        </div>
      </div>

      {/* Mobile-First Daromad Section */}
      <div className="card p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Award className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            {t('Daromad tarixi', language)}
          </h3>
          
          {/* Time Filter Select */}
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as any)}
            className="px-3 sm:px-4 py-2 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white font-medium text-gray-700 text-sm w-full sm:w-auto"
          >
            <option value="yesterday">{t('Kecha', language)}</option>
            <option value="today">{t('Bugun', language)}</option>
            <option value="week">{t('1 hafta', language)}</option>
            <option value="month">{t('1 oy', language)}</option>
            <option value="year">{t('1 yil', language)}</option>
            <option value="all">{t('Hammasi', language)}</option>
          </select>
        </div>

        {/* Mobile-Optimized Earnings Summary */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
            <p className="text-xs sm:text-sm text-blue-700 mb-1">{t('Tanlangan davr', language)}</p>
            <p className="text-2xl sm:text-3xl font-bold text-blue-900">
              {new Intl.NumberFormat('uz-UZ').format(filteredEarnings)}
            </p>
            <p className="text-xs text-blue-600 mt-1">{t('so\'m', language)}</p>
          </div>
          <div className="p-3 sm:p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200">
            <p className="text-xs sm:text-sm text-indigo-700 mb-1">{t('Vazifalar soni', language)}</p>
            <p className="text-2xl sm:text-3xl font-bold text-indigo-900">
              {filteredTasks.length}
            </p>
            <p className="text-xs text-indigo-600 mt-1">{t('ta vazifa', language)}</p>
          </div>
          <div className="p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
            <p className="text-xs sm:text-sm text-purple-700 mb-1">{t('O\'rtacha to\'lov', language)}</p>
            <p className="text-2xl sm:text-3xl font-bold text-purple-900">
              {filteredTasks.length > 0 
                ? new Intl.NumberFormat('uz-UZ').format(Math.round(filteredEarnings / filteredTasks.length))
                : '0'}
            </p>
            <p className="text-xs text-purple-600 mt-1">{t('so\'m/vazifa', language)}</p>
          </div>
        </div>

        {/* Tasks List */}
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <Award className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {timeFilter === 'today' ? t('Bugun daromad yo\'q', language) :
               timeFilter === 'yesterday' ? t('Kecha daromad yo\'q', language) :
               timeFilter === 'week' ? t('Bu haftada daromad yo\'q', language) :
               timeFilter === 'month' ? t('Bu oyda daromad yo\'q', language) :
               timeFilter === 'year' ? t('Bu yilda daromad yo\'q', language) :
               t('Hali daromad yo\'q', language)}
            </p>
            <p className="text-sm text-gray-400 mt-2">{t('Vazifalarni bajaring va daromad oling!', language)}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task, index) => {
                // Agar daromad bo'lmasa, ko'rsatmaymiz
                if (task.earning === 0) return null;
                
                return (
                  <div key={task._id} className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:shadow-md transition-shadow gap-3">
                    <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                      <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-blue-500 text-white font-bold text-sm sm:text-lg flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{task.title}</h4>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">
                          {task.car?.make} {task.car?.carModel} - {task.car?.licensePlate}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {task.approvedAt ? new Date(task.approvedAt).toLocaleDateString('uz-UZ', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'Sana noma\'lum'}
                        </p>
                        {task.percentage && task.totalPayment > 0 && (
                          <p className="text-xs text-blue-600 mt-1">
                            {t('Umumiy:', language)} {new Intl.NumberFormat('uz-UZ').format(task.totalPayment)} • {task.percentage}%
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg sm:text-2xl font-bold text-blue-600">
                        +{new Intl.NumberFormat('uz-UZ').format(task.earning)}
                      </p>
                      <p className="text-xs text-blue-700">so'm</p>
                      {task.percentage && (
                        <p className="text-xs text-gray-600">({task.percentage}%)</p>
                      )}
                    </div>
                  </div>
                );
              })}
            
            {filteredTasks.every((task) => task.earning === 0) && (
              <div className="text-center py-8">
                <p className="text-gray-500">{t('To\'lovli vazifalar yo\'q', language)}</p>
              </div>
            )}
          </div>
        )}
      </div>



      {/* Progress Chart */}
      <div className="card p-3 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">{t('Haftalik faoliyat', language)}</h3>
        {weeklyActivity.every(day => day.hours === 0) ? (
          <div className="text-center py-6 sm:py-8">
            <Clock className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-gray-500">{t('Hali haftalik faoliyat yo\'q', language)}</p>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">{t('Vazifalarni bajarib, statistikangizni ko\'ring!', language)}</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {weeklyActivity.map((day, index) => (
              <div key={index} className="flex items-center justify-between gap-2 sm:gap-4">
                <span className="text-xs sm:text-sm text-gray-600 w-16 sm:w-24 flex-shrink-0">{day.day}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${day.percentage}%` }}
                  ></div>
                </div>
                <span className="text-xs sm:text-sm text-gray-900 w-12 sm:w-16 text-right flex-shrink-0">
                  {day.hours > 0 ? `${day.hours.toFixed(1)} ${t('soat', language)}` : '-'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprenticeAchievements;
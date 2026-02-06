import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks, useUpdateTaskStatus, useRestartTask } from '@/hooks/useTasks';
import { 
  CheckSquare, 
  Clock, 
  AlertCircle, 
  CheckCircle,
  Calendar,
  Play,
  Check,
  Zap,
  Target,
  Filter,
  Search,
  Car,
  AlertTriangle,
  FileText,
  Sparkles,
  XCircle,
  Circle,
  DollarSign
} from 'lucide-react';
import { t } from '@/lib/transliteration';

const ApprenticeTasks: React.FC = () => {
  const { user } = useAuth();
  const { data: tasks, isLoading, error } = useTasks();
  const updateTaskStatus = useUpdateTaskStatus();
  const restartTaskMutation = useRestartTask();
  
  // localStorage'dan tilni o'qish
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);
  
  // Debug logging
  const [processingTaskId, setProcessingTaskId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'all' | 'completed'>('active'); // Default: faqat faol vazifalar
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');

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
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-orange-100 text-orange-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  const handleStartTask = async (taskId: string) => {
    setProcessingTaskId(taskId);
    try {
      await updateTaskStatus.mutateAsync({
        id: taskId,
        status: 'in-progress'
      });
    } finally {
      setProcessingTaskId(null);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    setProcessingTaskId(taskId);
    try {
      await updateTaskStatus.mutateAsync({
        id: taskId,
        status: 'completed'
      });
    } finally {
      setProcessingTaskId(null);
    }
  };

  const handleRestartTask = async (taskId: string) => {
    if (!confirm(t('Vazifani qayta boshlaysizmi?', language))) {
      return;
    }
    
    setProcessingTaskId(taskId);
    try {
      await restartTaskMutation.mutateAsync(taskId);
    } finally {
      setProcessingTaskId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('Vazifalar yuklanmoqda...', language)}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('Xatolik yuz berdi', language)}</h2>
          <p className="text-gray-600 mb-4">{t('Vazifalarni yuklashda muammo bo\'ldi', language)}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {t('Qayta yuklash', language)}
          </button>
        </div>
      </div>
    );
  }

  const assignedTasks = myTasks.filter((task: any) => task.status === 'assigned');
  const inProgressTasks = myTasks.filter((task: any) => task.status === 'in-progress');
  const completedTasks = myTasks.filter((task: any) => task.status === 'completed');
  const approvedTasks = myTasks.filter((task: any) => task.status === 'approved');
  const rejectedTasks = myTasks.filter((task: any) => task.status === 'rejected');

  // Filter tasks based on active tab
  let filteredTasks = myTasks;
  if (activeTab === 'active') {
    // Faqat faol vazifalar (tasdiqlangan va rad etilganlarni QOLDIRISH, faqat tasdiqlangan o'chadi)
    filteredTasks = myTasks.filter((task: any) => 
      task.status !== 'approved' // Faqat tasdiqlangan vazifalar yashirin
    );
  } else if (activeTab === 'completed') {
    filteredTasks = [...completedTasks, ...approvedTasks];
  }

  // Apply search filter
  if (searchQuery) {
    filteredTasks = filteredTasks.filter((task: any) => 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.car?.make?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (task.car?.carModel?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }

  // Apply priority filter
  if (filterPriority !== 'all') {
    filteredTasks = filteredTasks.filter((task: any) => task.priority === filterPriority);
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-8">
      {/* Responsive Header with Blue Theme */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 p-4 sm:p-6 md:p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 mb-3">
            <div className="p-2 sm:p-3 bg-white/20 rounded-xl backdrop-blur-sm flex-shrink-0">
              <Target className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold truncate">{t('Mening vazifalarim', language)}</h1>
              <p className="text-blue-100 mt-1 text-xs sm:text-sm md:text-base">
                {t('Sizga berilgan', language)} {myTasks.length} {t('ta vazifani boshqaring', language)}
              </p>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 md:w-64 md:h-64 bg-white/5 rounded-full -mr-12 sm:-mr-16 md:-mr-32 -mt-12 sm:-mt-16 md:-mt-32"></div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { 
            name: t('Tayinlangan', language), 
            value: assignedTasks.length, 
            icon: CheckSquare, 
            gradient: 'from-blue-500 to-cyan-500',
            iconBg: 'from-blue-100 to-cyan-100'
          },
          { 
            name: t('Jarayonda', language), 
            value: inProgressTasks.length, 
            icon: Clock, 
            gradient: 'from-yellow-500 to-orange-500',
            iconBg: 'from-yellow-100 to-orange-100'
          },
          { 
            name: t('Bajarilgan', language), 
            value: completedTasks.length, 
            icon: AlertCircle, 
            gradient: 'from-orange-500 to-red-500',
            iconBg: 'from-orange-100 to-red-100'
          },
          { 
            name: t('Rad etilgan', language), 
            value: rejectedTasks.length, 
            icon: XCircle, 
            gradient: 'from-red-500 to-pink-500',
            iconBg: 'from-red-100 to-pink-100'
          },
          { 
            name: t('Tasdiqlangan', language), 
            value: approvedTasks.length, 
            icon: CheckCircle, 
            gradient: 'from-green-500 to-emerald-500',
            iconBg: 'from-green-100 to-emerald-100'
          },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div 
              key={stat.name}
              className="group relative overflow-hidden rounded-lg sm:rounded-xl bg-white p-3 sm:p-4 md:p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-100"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className={`flex h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br ${stat.iconBg} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 bg-gradient-to-br ${stat.gradient} bg-clip-text text-transparent`} />
                  </div>
                </div>
                <div className="mt-2 sm:mt-3 md:mt-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{stat.name}</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mt-0.5 sm:mt-1">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs and Filters */}
      <div className="card p-4 sm:p-6">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 gap-4">
          {/* Tabs */}
          <div className="flex space-x-1 sm:space-x-2 bg-gray-100 p-1 rounded-lg overflow-x-auto">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                activeTab === 'active'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('Faol', language)} ({myTasks.filter((t: any) => t.status !== 'approved').length})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('Hammasi', language)} ({myTasks.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                activeTab === 'completed'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('Bajarilgan', language)} ({completedTasks.length + approvedTasks.length})
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('Qidirish...', language)}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-48 md:w-64 text-sm"
              />
            </div>

            {/* Priority Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white w-full sm:w-40 md:w-48 text-sm"
              >
                <option value="all">{t('Barcha muhimlik', language)}</option>
                <option value="urgent">{t('Shoshilinch', language)}</option>
                <option value="high">{t('Yuqori', language)}</option>
                <option value="medium">{t('O\'rta', language)}</option>
                <option value="low">{t('Past', language)}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="card p-8 sm:p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 mb-4">
              <Target className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{t('Vazifalar topilmadi', language)}</h3>
            <p className="text-sm sm:text-base text-gray-500">
              {searchQuery || filterPriority !== 'all' 
                ? t('Qidiruv yoki filtr bo\'yicha vazifalar topilmadi', language)
                : t('Hozirda sizga vazifa berilmagan', language)}
            </p>
          </div>
        ) : (
          filteredTasks.map((task: any, index: number) => {
            const isCompleted = task.status === 'completed' || task.status === 'approved';
            
            return (
              <div 
                key={task._id}
                className={`group card p-4 sm:p-6 hover:shadow-xl transition-all duration-300 border-l-4 ${
                  task.status === 'approved' ? 'border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-transparent' :
                  task.status === 'completed' ? 'border-l-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent' :
                  task.status === 'rejected' ? 'border-l-red-500 bg-gradient-to-r from-red-50/50 to-transparent' :
                  task.status === 'in-progress' ? 'border-l-yellow-500 bg-gradient-to-r from-yellow-50/50 to-transparent' :
                  'border-l-cyan-500 bg-gradient-to-r from-cyan-50/50 to-transparent'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex flex-col space-y-4 lg:flex-row lg:items-start lg:justify-between lg:space-y-0 gap-4">
                  {/* Left Content */}
                  <div className="flex-1 space-y-3 sm:space-y-4 min-w-0">
                    {/* Title and Status */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg sm:text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2 truncate">
                          {task.title}
                        </h4>
                        <p className="text-sm sm:text-base text-gray-600 leading-relaxed line-clamp-2">{task.description}</p>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Priority Badge */}
                      <span className={`inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold rounded-lg ${getPriorityColor(task.priority)}`}>
                        {task.priority === 'urgent' && <AlertTriangle className="h-3 w-3 mr-1 sm:mr-1.5" />}
                        {task.priority === 'high' && <AlertCircle className="h-3 w-3 mr-1 sm:mr-1.5" />}
                        {task.priority === 'medium' && <Circle className="h-3 w-3 mr-1 sm:mr-1.5" />}
                        {task.priority === 'low' && <CheckCircle className="h-3 w-3 mr-1 sm:mr-1.5" />}
                        <span className="hidden sm:inline">
                          {task.priority === 'urgent' ? t('Shoshilinch', language) : 
                           task.priority === 'high' ? t('Yuqori', language) :
                           task.priority === 'medium' ? t('O\'rta', language) : t('Past', language)}
                        </span>
                        <span className="sm:hidden">
                          {task.priority === 'urgent' ? t('Shosh', language) : 
                           task.priority === 'high' ? t('Yuq', language) :
                           task.priority === 'medium' ? t('O\'rta', language) : t('Past', language)}
                        </span>
                      </span>

                      {/* Status Badge */}
                      <span className={`inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-semibold rounded-lg ${getStatusColor(task.status)}`}>
                        {task.status === 'assigned' && <FileText className="h-3 w-3 mr-1 sm:mr-1.5" />}
                        {task.status === 'in-progress' && <Zap className="h-3 w-3 mr-1 sm:mr-1.5" />}
                        {task.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1 sm:mr-1.5" />}
                        {task.status === 'approved' && <Sparkles className="h-3 w-3 mr-1 sm:mr-1.5" />}
                        {task.status === 'rejected' && <XCircle className="h-3 w-3 mr-1 sm:mr-1.5" />}
                        <span className="hidden sm:inline">
                          {task.status === 'assigned' ? t('Tayinlangan', language) :
                           task.status === 'in-progress' ? t('Jarayonda', language) :
                           task.status === 'completed' ? t('Bajarilgan', language) :
                           task.status === 'approved' ? t('Tasdiqlangan', language) : t('Rad etilgan', language)}
                        </span>
                        <span className="sm:hidden">
                          {task.status === 'assigned' ? t('Tayinl', language) :
                           task.status === 'in-progress' ? t('Jaray', language) :
                           task.status === 'completed' ? t('Bajar', language) :
                           task.status === 'approved' ? t('Tasdiq', language) : t('Rad', language)}
                        </span>
                      </span>

                      {/* Due Date */}
                      <span className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg">
                        <Calendar className="h-3 w-3 mr-1 sm:mr-1.5" />
                        <span className="hidden sm:inline">
                          {new Date(task.dueDate).toLocaleDateString('uz-UZ')}
                        </span>
                        <span className="sm:hidden">
                          {new Date(task.dueDate).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' })}
                        </span>
                      </span>

                      {/* Hours */}
                      <span className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg">
                        <Clock className="h-3 w-3 mr-1 sm:mr-1.5" />
                        {isCompleted && task.actualHours ? `${task.actualHours} ${t('soat', language)}` : `${task.estimatedHours} ${t('soat', language)}`}
                      </span>

                      {/* Payment - Shogird ulushi ko'rsatish */}
                      {(() => {
                        // Yangi tizim: assignments orqali shogird ulushini topish
                        if (task.assignments && task.assignments.length > 0) {
                          const myAssignment = task.assignments.find((a: any) => {
                            const apprenticeId = typeof a.apprentice === 'object' ? a.apprentice._id : a.apprentice;
                            return apprenticeId === user?.id;
                          });
                          
                          if (myAssignment && myAssignment.earning > 0) {
                            return (
                              <span className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-bold rounded-lg bg-blue-100 text-blue-700">
                                <DollarSign className="h-3.5 w-3.5" />
                                <span className="ml-1">{new Intl.NumberFormat('uz-UZ').format(myAssignment.earning)}</span>
                                <span className="hidden sm:inline ml-1">{t('so\'m', language)}</span>
                                {myAssignment.percentage && (
                                  <span className="ml-1 text-blue-600">({myAssignment.percentage}%)</span>
                                )}
                              </span>
                            );
                          }
                        }
                        
                        // Eski tizim: apprenticeEarning
                        if (task.apprenticeEarning && task.apprenticeEarning > 0) {
                          return (
                            <span className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-bold rounded-lg bg-blue-100 text-blue-700">
                              <DollarSign className="h-3.5 w-3.5" />
                              <span className="ml-1">{new Intl.NumberFormat('uz-UZ').format(task.apprenticeEarning)}</span>
                              <span className="hidden sm:inline ml-1">{t('so\'m', language)}</span>
                              {task.apprenticePercentage && (
                                <span className="ml-1 text-blue-600">({task.apprenticePercentage}%)</span>
                              )}
                            </span>
                          );
                        }
                        
                        // Hech narsa yo'q
                        return (
                          <span className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-bold rounded-lg bg-gray-100 text-gray-500">
                            <DollarSign className="h-3.5 w-3.5" />
                            <span className="ml-1">0</span>
                            <span className="hidden sm:inline ml-1">{t('so\'m', language)}</span>
                          </span>
                        );
                      })()}
                    </div>

                    {/* Car Info */}
                    {task.car && (
                      <div className="flex items-center space-x-3 p-3 sm:p-4 bg-white/80 rounded-xl border border-gray-200">
                        <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm sm:text-lg shadow-lg">
                          {task.car.make?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <Car className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{task.car.make || 'Noma\'lum'} {task.car.carModel || ''}</span>
                          </p>
                          <p className="text-xs text-gray-500 truncate">{task.car.licensePlate || 'Raqam yo\'q'}</p>
                        </div>
                      </div>
                    )}

                    {/* Notes and Rejection Reason */}
                    {task.notes && (
                      <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
                        <p className="text-sm text-blue-900">
                          <strong className="font-semibold">Izoh:</strong> {task.notes}
                        </p>
                      </div>
                    )}
                    {task.rejectionReason && (
                      <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                        <p className="text-sm text-red-900">
                          <strong className="font-semibold">Rad etish sababi:</strong> {task.rejectionReason}
                        </p>
                      </div>
                    )}
                    {isCompleted && task.completedAt && (
                      <div className="flex items-center text-sm text-gray-500">
                        <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
                        Bajarildi: {new Date(task.completedAt).toLocaleDateString('uz-UZ', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    )}
                  </div>

                  {/* Right Actions */}
                  <div className="flex flex-row lg:flex-col gap-2 sm:gap-3 lg:min-w-0 lg:w-auto">
                    {task.status === 'assigned' && (
                      <button 
                        onClick={() => handleStartTask(task._id)}
                        disabled={processingTaskId === task._id}
                        className="flex-1 lg:flex-none btn bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap text-sm px-3 py-2 sm:px-4 sm:py-2"
                      >
                        {processingTaskId === task._id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            <span className="hidden sm:inline">Yuklanmoqda...</span>
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4" />
                            <span>{t('Boshlash', language)}</span>
                          </>
                        )}
                      </button>
                    )}
                    {task.status === 'in-progress' && (
                      <button 
                        onClick={() => handleCompleteTask(task._id)}
                        disabled={processingTaskId === task._id}
                        className="flex-1 lg:flex-none btn bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap text-sm px-3 py-2 sm:px-4 sm:py-2"
                      >
                        {processingTaskId === task._id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            <span className="hidden sm:inline">Yuklanmoqda...</span>
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4" />
                            <span>{t('Tugatish', language)}</span>
                          </>
                        )}
                      </button>
                    )}
                    {task.status === 'rejected' && (
                      <button 
                        onClick={() => handleRestartTask(task._id)}
                        disabled={processingTaskId === task._id}
                        className="flex-1 lg:flex-none btn bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap text-sm px-3 py-2 sm:px-4 sm:py-2"
                      >
                        {processingTaskId === task._id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            <span className="hidden sm:inline">Yuklanmoqda...</span>
                          </>
                        ) : (
                          <>
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>{t('Qayta boshlash', language)}</span>
                          </>
                        )}
                      </button>
                    )}
                    {task.status === 'approved' && (
                      <div className="flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 bg-green-100 text-green-700 rounded-lg font-semibold text-sm">
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                        <span className="hidden sm:inline">{t('Tasdiqlangan', language)}</span>
                        <span className="sm:hidden">{t('Tasdiq', language)}</span>
                      </div>
                    )}
                    {task.status === 'completed' && (
                      <div className="flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 bg-orange-100 text-orange-700 rounded-lg font-semibold text-sm">
                        <Clock className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                        <span className="hidden sm:inline">{t('Kutilmoqda', language)}</span>
                        <span className="sm:hidden">{t('Kutish', language)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ApprenticeTasks;
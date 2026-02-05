import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks, useUpdateTaskStatus } from '@/hooks/useTasks';
import { 
  Clock, 
  CheckCircle,
  Calendar,
  Award,
  Target,
  Zap,
  AlertTriangle,
  AlertCircle,
  FileText,
  Sparkles,
  XCircle,
  Circle,
  TrendingUp,
  Star,
  Flame,
  Trophy,
  Rocket,
  Activity,
  Gift
} from 'lucide-react';
import { t } from '@/lib/transliteration';

const ApprenticeDashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const updateTaskStatus = useUpdateTaskStatus();
  const [processingTaskId, setProcessingTaskId] = useState<string | null>(null);

  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  // Vazifalarni filtrlash
  const allTasks = tasks?.tasks || [];
  const myTasks = allTasks.filter((task: any) => {
    const assignedToId = typeof task.assignedTo === 'object' ? task.assignedTo._id : task.assignedTo;
    return assignedToId === user?.id;
  });

  const todayTasks = myTasks.filter((task: any) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(task.dueDate);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate.getTime() === today.getTime();
  });
  
  const inProgressTasks = myTasks.filter((task: any) => task.status === 'in-progress');
  const completedTasks = myTasks.filter((task: any) => task.status === 'completed');
  const approvedTasks = myTasks.filter((task: any) => task.status === 'approved');

  const taskStats = [
    {
      name: t('Bugungi', language),
      value: todayTasks.length,
      icon: Calendar,
      color: 'purple'
    },
    {
      name: t('Jarayonda', language),
      value: inProgressTasks.length,
      icon: Clock,
      color: 'yellow'
    },
    {
      name: t('Bajarilgan', language),
      value: completedTasks.length + approvedTasks.length,
      icon: CheckCircle,
      color: 'green'
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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

  // Statistika hisoblash
  const totalEarnings = user?.earnings || 0;
  const completionRate = myTasks.length > 0 ? Math.round(((completedTasks.length + approvedTasks.length) / myTasks.length) * 100) : 0;
  const weeklyProgress = Math.min(100, (approvedTasks.length * 20));

  return (
    <div className="min-h-screen pb-20 sm:pb-24 space-y-4 sm:space-y-6 px-2 sm:px-0 animate-fade-in">
      {/* Premium Hero Section with Animated Background */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-500 via-indigo-600 to-blue-700 p-6 sm:p-8 text-white shadow-2xl">
        {/* Animated Background Patterns */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-48 sm:w-72 h-48 sm:h-72 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-float"></div>
          <div className="absolute bottom-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-blue-300 rounded-full mix-blend-overlay filter blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-48 sm:w-64 h-48 sm:h-64 bg-indigo-300 rounded-full mix-blend-overlay filter blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative z-10">
          {/* Greeting with Icon */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-lg animate-bounce-slow">
              <Rocket className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-1 tracking-tight">
                {t('Salom', language)}, {user?.name}!
              </h1>
              <p className="text-blue-100 text-sm sm:text-base flex items-center gap-2">
                <Flame className="h-4 w-4 text-yellow-300 animate-pulse" />
                {t('Bugun', language)} {todayTasks.length} {t('ta vazifa sizni kutmoqda', language)}
              </p>
            </div>
          </div>
          
          {/* Premium Stats Grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6">
            {/* Tasdiqlangan vazifalar */}
            <div className="group relative bg-white/15 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/30 shadow-xl hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-400/30 rounded-lg sm:rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-blue-400/20 rounded-lg">
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-blue-200" />
                  </div>
                </div>
                <span className="text-blue-100 text-xs font-medium mb-1 block">{t('Tasdiqlangan', language)}</span>
                <div className="text-2xl sm:text-3xl font-black tracking-tight">{approvedTasks.length}</div>
                <div className="mt-1 sm:mt-2 flex items-center gap-1 text-xs text-blue-200">
                  <Star className="h-3 w-3 fill-yellow-300 text-yellow-300" />
                  <span>{completionRate}% {t('bajarilgan', language)}</span>
                </div>
              </div>
            </div>

            {/* Daromad */}
            <div className="group relative bg-white/15 backdrop-blur-xl rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/30 shadow-xl hover:bg-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 to-transparent rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-400/30 rounded-lg sm:rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <Award className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-200" />
                  </div>
                  <div className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-yellow-400/20 rounded-lg">
                    <Gift className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-200" />
                  </div>
                </div>
                <span className="text-blue-100 text-xs font-medium mb-1 block">{t('Daromad', language)}</span>
                <div className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight">
                  {new Intl.NumberFormat('uz-UZ').format(totalEarnings)}
                </div>
                <div className="mt-1 sm:mt-2 flex items-center gap-1 text-xs text-blue-200">
                  <Trophy className="h-3 w-3 fill-yellow-300 text-yellow-300" />
                  <span>{t('Joriy oylik', language)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 sm:mt-6 bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm font-semibold text-white flex items-center gap-2">
                <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
                {t('Haftalik progress', language)}
              </span>
              <span className="text-xs sm:text-sm font-bold text-white">{weeklyProgress}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2 sm:h-3 overflow-hidden backdrop-blur-sm">
              <div 
                className="h-full bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 rounded-full transition-all duration-1000 ease-out shadow-lg relative overflow-hidden"
                style={{ width: `${weeklyProgress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Task Statistics Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
        {taskStats.map((stat, index) => {
          const Icon = stat.icon;
          const colors = {
            purple: {
              bg: 'from-purple-500 to-indigo-600',
              icon: 'bg-purple-100 text-purple-600',
              glow: 'shadow-glow',
              border: 'border-purple-200/50'
            },
            yellow: {
              bg: 'from-amber-400 to-orange-500',
              icon: 'bg-amber-100 text-amber-600',
              glow: 'shadow-glow-yellow',
              border: 'border-amber-200/50'
            },
            green: {
              bg: 'from-emerald-500 to-green-600',
              icon: 'bg-emerald-100 text-emerald-600',
              glow: 'shadow-glow-green',
              border: 'border-emerald-200/50'
            }
          };
          const color = colors[stat.color as keyof typeof colors];
          
          return (
            <div 
              key={stat.name}
              className={`group relative bg-gradient-to-br ${color.bg} rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 animate-slide-up border border-white/20`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Glow effect */}
              <div className={`absolute inset-0 ${color.glow} rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              
              <div className="relative">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className={`w-9 h-9 sm:w-11 sm:h-11 ${color.icon} rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg backdrop-blur-sm group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse"></div>
                </div>
                <span className="text-white/90 text-xs font-semibold mb-0.5 sm:mb-1 tracking-wide block">{stat.name}</span>
                <div className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
                  {tasksLoading ? (
                    <div className="animate-pulse bg-white/30 h-6 sm:h-8 w-10 sm:w-12 rounded-lg"></div>
                  ) : (
                    stat.value
                  )}
                </div>
                
                {/* Decorative element */}
                <div className="absolute -bottom-1 -right-1 w-12 sm:w-16 h-12 sm:h-16 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Premium Today's Tasks Section */}
      <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden animate-slide-up" style={{ animationDelay: '300ms' }}>
        {/* Premium Header with Gradient */}
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-6 text-white overflow-hidden">
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse"></div>
          </div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-lg">
                <Target className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight">{t('Bugungi vazifalar', language)}</h3>
                <p className="text-blue-100 text-sm">{t('Bugun bajarilishi kerak', language)}</p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-3xl font-black">{todayTasks.length}</span>
              <span className="text-xs text-emerald-100 font-medium">{t('vazifa', language)}</span>
            </div>
          </div>
        </div>
        
        <div className="p-4 sm:p-6">
          {todayTasks.length === 0 ? (
            <div className="text-center py-8 sm:py-12 animate-bounce-in">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600" />
              </div>
              <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{t('Ajoyib!', language)}</h4>
              <p className="text-sm sm:text-base text-gray-500">{t('Bugun sizga vazifa berilmagan', language)}</p>
              <div className="mt-3 sm:mt-4 inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-xs sm:text-sm font-semibold">
                <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-blue-500 text-blue-500" />
                {t('Dam oling!', language)}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {todayTasks.map((task: any, index: number) => {
                let borderColor = 'border-l-gray-400';
                let bgGradient = 'from-gray-50 to-white';
                let statusIcon = null;
                let statusBadge = '';
                
                if (task.status === 'completed' || task.status === 'approved') {
                  borderColor = 'border-l-blue-500';
                  bgGradient = 'from-blue-50 to-indigo-50';
                  statusIcon = <CheckCircle className="h-6 w-6 text-blue-600" />;
                  statusBadge = 'bg-blue-100 text-blue-700 border-blue-200';
                } else if (task.status === 'in-progress') {
                  borderColor = 'border-l-amber-500';
                  bgGradient = 'from-amber-50 to-orange-50';
                  statusIcon = <Clock className="h-6 w-6 text-amber-600" />;
                  statusBadge = 'bg-amber-100 text-amber-700 border-amber-200';
                } else if (task.status === 'assigned') {
                  borderColor = 'border-l-indigo-500';
                  bgGradient = 'from-indigo-50 to-blue-50';
                  statusIcon = <Zap className="h-6 w-6 text-indigo-600" />;
                  statusBadge = 'bg-indigo-100 text-indigo-700 border-indigo-200';
                }
                
                return (
                  <div 
                    key={task._id}
                    className={`group relative border-l-4 ${borderColor} bg-gradient-to-br ${bgGradient} rounded-2xl p-5 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] animate-slide-up border border-gray-200/50`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Hover glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
                    
                    <div className="relative flex items-start gap-4">
                      {/* Status Icon */}
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          {statusIcon}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {/* Task Title */}
                        <h4 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-blue-600 transition-colors">
                          {task.title}
                        </h4>
                        
                        {/* Task Description */}
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                          {task.description}
                        </p>
                        
                        {/* Badges */}
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          {/* Priority Badge */}
                          <span className={`inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-xl border shadow-sm ${getPriorityColor(task.priority)}`}>
                            {task.priority === 'urgent' && <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />}
                            {task.priority === 'high' && <AlertCircle className="h-3.5 w-3.5 mr-1.5" />}
                            {task.priority === 'medium' && <Circle className="h-3.5 w-3.5 mr-1.5" />}
                            {task.priority === 'low' && <CheckCircle className="h-3.5 w-3.5 mr-1.5" />}
                            {task.priority === 'urgent' ? t('Shoshilinch', language) : 
                             task.priority === 'high' ? t('Yuqori', language) :
                             task.priority === 'medium' ? t('O\'rta', language) : t('Past', language)}
                          </span>
                          
                          {/* Status Badge */}
                          <span className={`inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-xl border shadow-sm ${statusBadge}`}>
                            {task.status === 'assigned' && <FileText className="h-3.5 w-3.5 mr-1.5" />}
                            {task.status === 'in-progress' && <Zap className="h-3.5 w-3.5 mr-1.5" />}
                            {task.status === 'completed' && <CheckCircle className="h-3.5 w-3.5 mr-1.5" />}
                            {task.status === 'approved' && <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
                            {task.status === 'rejected' && <XCircle className="h-3.5 w-3.5 mr-1.5" />}
                            {task.status === 'assigned' ? t('Tayinlangan', language) :
                             task.status === 'in-progress' ? t('Jarayonda', language) :
                             task.status === 'completed' ? t('Bajarilgan', language) :
                             task.status === 'approved' ? t('Tasdiqlangan', language) : t('Rad etilgan', language)}
                          </span>
                          
                          {/* Time Badge */}
                          <span className="inline-flex items-center px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl border border-gray-300 shadow-sm">
                            <Clock className="h-3.5 w-3.5 mr-1.5" />
                            {task.estimatedHours} {t('soat', language)}
                          </span>
                        </div>
                        
                        {/* Car Info Card */}
                        {task.car && (
                          <div className="flex items-center gap-3 p-3 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 mb-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg">
                              {task.car.make.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900 truncate">
                                {task.car.make} {task.car.carModel}
                              </p>
                              <p className="text-xs text-gray-500 font-semibold">{task.car.licensePlate}</p>
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        {task.status === 'assigned' && (
                          <button 
                            onClick={() => handleStartTask(task._id)}
                            disabled={processingTaskId === task._id}
                            className="w-full px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all duration-300 flex items-center justify-center gap-2 font-bold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                          >
                            {processingTaskId === task._id ? (
                              <>
                                <div className="animate-spin rounded-full h-5 w-5 border-3 border-white border-t-transparent"></div>
                                <span>{t('Yuklanmoqda...', language)}</span>
                              </>
                            ) : (
                              <>
                                <Zap className="h-5 w-5" />
                                <span>{t('Boshlash', language)}</span>
                              </>
                            )}
                          </button>
                        )}
                        {task.status === 'in-progress' && (
                          <button 
                            onClick={() => handleCompleteTask(task._id)}
                            disabled={processingTaskId === task._id}
                            className="w-full px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all duration-300 flex items-center justify-center gap-2 font-bold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                          >
                            {processingTaskId === task._id ? (
                              <>
                                <div className="animate-spin rounded-full h-5 w-5 border-3 border-white border-t-transparent"></div>
                                <span>{t('Yuklanmoqda...', language)}</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-5 w-5" />
                                <span>{t('Tugatish', language)}</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Daromad Tarixi */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 sm:p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 sm:h-5 sm:w-5" />
              <h3 className="text-base sm:text-lg font-bold">{t('Daromad tarixi', language)}</h3>
            </div>
            <div className="text-right">
              <div className="text-lg sm:text-xl font-bold">{new Intl.NumberFormat('uz-UZ').format(user?.earnings || 0)}</div>
              <div className="text-xs text-blue-100">{t('Joriy oylik', language)}</div>
            </div>
          </div>
        </div>
        
        <div className="p-3 sm:p-4">
          <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3">{t('Oxirgi daromadlar', language)}</h4>
          
          {approvedTasks.length === 0 ? (
            <div className="text-center py-6">
              <Award className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">{t('Hali daromad yo\'q', language)}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {approvedTasks
                .filter((task: any) => task.payment && task.payment > 0)
                .sort((a: any, b: any) => new Date(b.approvedAt || b.createdAt).getTime() - new Date(a.approvedAt || a.createdAt).getTime())
                .slice(0, 5)
                .map((task: any) => (
                  <div key={task._id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex-1 min-w-0">
                      <h5 className="font-semibold text-gray-900 truncate text-sm">{task.title}</h5>
                      <p className="text-xs text-gray-600 truncate">
                        {task.car?.make} {task.car?.carModel}
                      </p>
                    </div>
                    <div className="text-right ml-3">
                      <p className="text-base font-bold text-blue-600">
                        +{new Intl.NumberFormat('uz-UZ').format(task.payment)}
                      </p>
                    </div>
                  </div>
                ))}
              
              {approvedTasks.filter((task: any) => task.payment && task.payment > 0).length === 0 && (
                <div className="text-center py-6">
                  <p className="text-gray-500 text-sm">{t('To\'lovli vazifalar yo\'q', language)}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApprenticeDashboard;

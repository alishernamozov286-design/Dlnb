import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks, useUpdateTaskStatus } from '@/hooks/useTasks';
import { 
  Clock, 
  CheckCircle,
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
} from 'lucide-react';
import { t } from '@/lib/transliteration';

const ApprenticeDashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: tasks } = useTasks();
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
  
  // Tasdiqlangan vazifalardan jami daromad
  const totalApprovedEarnings = approvedTasks.reduce((sum: number, task: any) => {
    return sum + (task.payment || 0);
  }, 0);
  
  // Ish soatlari (jarayondagi vazifalar)
  const totalWorkHours = inProgressTasks.reduce((sum: number, task: any) => {
    return sum + (task.estimatedHours || 0);
  }, 0);

  // Salomlashish uchun vaqtni aniqlash
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("Xayrli tong", language);
    if (hour < 18) return t("Xayrli kun", language);
    return t("Xayrli kech", language);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-lg mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                {getGreeting()}, {user?.name || t("Shogirt", language)}! 
              </h1>
              <p className="text-blue-100 text-lg">
                {t("Bugun ham ajoyib natijalar ko'rsatasiz deb umid qilamiz", language)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-blue-100 text-sm mb-1">{t("Sizning foizingiz", language)}</p>
              <p className="text-4xl font-bold">{user?.percentage || 0}%</p>
            </div>
          </div>
        </div>

        {/* Top Stats Grid - 4 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Bugungi vazifalar */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 mb-1">{t("Bugungi vazifalar", language)}</p>
                <p className="text-2xl font-bold text-gray-900">{todayTasks.length}</p>
              </div>
            </div>
          </div>

          {/* Jarayonda */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Zap className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 mb-1">{t("Jarayonda", language)}</p>
                <p className="text-2xl font-bold text-gray-900">{inProgressTasks.length}</p>
              </div>
            </div>
          </div>

          {/* Bajarilgan */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 mb-1">{t("Bajarilgan", language)}</p>
                <p className="text-2xl font-bold text-gray-900">{completedTasks.length}</p>
              </div>
            </div>
          </div>

          {/* Tasdiqlangan */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 mb-1">{t("Tasdiqlangan", language)}</p>
                <p className="text-2xl font-bold text-gray-900">{approvedTasks.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Stats - 3 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Bajarish foizi */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-purple-700 font-medium mb-1">{t("Bajarish foizi", language)}</p>
                <p className="text-3xl font-bold text-gray-900">{completionRate}%</p>
                <p className="text-sm text-purple-600 mt-1">{t("Jami vazifalardan", language)}</p>
              </div>
            </div>
          </div>

          {/* Ish soatlari */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-indigo-700 font-medium mb-1">{t("Ish soatlari", language)}</p>
                <p className="text-3xl font-bold text-gray-900">{totalWorkHours}</p>
                <p className="text-sm text-indigo-600 mt-1">{t("soat (jarayonda)", language)}</p>
              </div>
            </div>
          </div>

          {/* Jami vazifalar */}
          <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gray-700 flex items-center justify-center flex-shrink-0 shadow-lg">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700 font-medium mb-1">{t("Jami vazifalar", language)}</p>
                <p className="text-3xl font-bold text-gray-900">{myTasks.length}</p>
                <p className="text-sm text-gray-600 mt-1">{t("ta vazifa", language)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Large Blue Card - Daromad ma'lumotlari */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <Award className="h-10 w-10 text-white" />
              </div>
              <div>
                <p className="text-lg font-medium text-blue-100 mb-2">{t("Joriy oylik daromad", language)}</p>
                <p className="text-5xl font-bold">{new Intl.NumberFormat('uz-UZ').format(totalEarnings)}</p>
                <p className="text-blue-100 mt-1">{t("so'm", language)}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="mb-4">
                <p className="text-blue-100 text-sm mb-1">{t("Tasdiqlangan", language)}</p>
                <p className="text-3xl font-bold">{new Intl.NumberFormat('uz-UZ').format(totalApprovedEarnings)}</p>
                <p className="text-blue-100 text-xs">{t("so'm (barcha vaqt)", language)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Stats - 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Oylik maqsad */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-green-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Target className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-green-700 font-medium mb-1">{t("Oylik maqsad", language)}</p>
                <p className="text-3xl font-bold text-gray-900">{completedTasks.length + approvedTasks.length}</p>
                <p className="text-sm text-green-600 mt-1">{t("ta vazifa bajarildi", language)}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-green-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{t("Bajarish foizi", language)}</span>
                <span className="text-gray-900 font-semibold">{completionRate}%</span>
              </div>
              <div className="mt-2 w-full bg-green-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Ish faoliyati */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-blue-700 font-medium mb-1">{t("Ish faoliyati", language)}</p>
                <p className="text-3xl font-bold text-gray-900">{inProgressTasks.length}</p>
                <p className="text-sm text-blue-600 mt-1">{t("ta vazifa jarayonda", language)}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-blue-200">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">{t("Bugungi vazifalar", language)}</span>
                <span className="text-gray-900 font-semibold">{todayTasks.length} ta</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{t("Jami soatlar", language)}</span>
                <span className="text-gray-900 font-semibold">{totalWorkHours} soat</span>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Tasks Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">{t('Bugungi vazifalar', language)}</h3>
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
              {todayTasks.length} {t('vazifa', language)}
            </span>
          </div>
          
          <div className="space-y-3">
            {todayTasks.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-blue-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">{t('Ajoyib!', language)}</h4>
                <p className="text-gray-600">{t('Bugun sizga vazifa berilmagan', language)}</p>
              </div>
            ) : (
              todayTasks.map((task: any) => {
                let bgColor = 'bg-gray-50';
                let borderColor = 'border-gray-200';
                let badgeColor = 'bg-gray-100 text-gray-700';
                
                if (task.status === 'completed' || task.status === 'approved') {
                  bgColor = 'bg-green-50';
                  borderColor = 'border-green-200';
                  badgeColor = 'bg-green-100 text-green-700';
                } else if (task.status === 'in-progress') {
                  bgColor = 'bg-amber-50';
                  borderColor = 'border-amber-200';
                  badgeColor = 'bg-amber-100 text-amber-700';
                } else if (task.status === 'assigned') {
                  bgColor = 'bg-blue-50';
                  borderColor = 'border-blue-200';
                  badgeColor = 'bg-blue-100 text-blue-700';
                }
                
                return (
                  <div 
                    key={task._id}
                    className={`${bgColor} border ${borderColor} rounded-xl p-4 hover:shadow-md transition-all`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 mb-2">{task.title}</h4>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
                        
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-lg ${getPriorityColor(task.priority)}`}>
                            {task.priority === 'urgent' && <AlertTriangle className="h-3 w-3 mr-1" />}
                            {task.priority === 'high' && <AlertCircle className="h-3 w-3 mr-1" />}
                            {task.priority === 'medium' && <Circle className="h-3 w-3 mr-1" />}
                            {task.priority === 'low' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {task.priority === 'urgent' ? t('Shoshilinch', language) : 
                             task.priority === 'high' ? t('Yuqori', language) :
                             task.priority === 'medium' ? t('O\'rta', language) : t('Past', language)}
                          </span>
                          
                          <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-lg ${badgeColor}`}>
                            {task.status === 'assigned' && <FileText className="h-3 w-3 mr-1" />}
                            {task.status === 'in-progress' && <Zap className="h-3 w-3 mr-1" />}
                            {task.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                            {task.status === 'approved' && <Sparkles className="h-3 w-3 mr-1" />}
                            {task.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                            {task.status === 'assigned' ? t('Tayinlangan', language) :
                             task.status === 'in-progress' ? t('Jarayonda', language) :
                             task.status === 'completed' ? t('Bajarilgan', language) :
                             task.status === 'approved' ? t('Tasdiqlangan', language) : t('Rad etilgan', language)}
                          </span>
                          
                          <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold bg-gray-100 text-gray-700 rounded-lg">
                            <Clock className="h-3 w-3 mr-1" />
                            {task.estimatedHours} {t('soat', language)}
                          </span>
                        </div>
                        
                        {task.car && (
                          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 mb-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                              {task.car.make.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {task.car.make} {task.car.carModel}
                              </p>
                              <p className="text-xs text-gray-600">{task.car.licensePlate}</p>
                            </div>
                          </div>
                        )}

                        {task.status === 'assigned' && (
                          <button 
                            onClick={() => handleStartTask(task._id)}
                            disabled={processingTaskId === task._id}
                            className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 font-semibold text-sm"
                          >
                            {processingTaskId === task._id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                <span>{t('Yuklanmoqda...', language)}</span>
                              </>
                            ) : (
                              <>
                                <Zap className="h-4 w-4" />
                                <span>{t('Boshlash', language)}</span>
                              </>
                            )}
                          </button>
                        )}
                        {task.status === 'in-progress' && (
                          <button 
                            onClick={() => handleCompleteTask(task._id)}
                            disabled={processingTaskId === task._id}
                            className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 font-semibold text-sm"
                          >
                            {processingTaskId === task._id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                <span>{t('Yuklanmoqda...', language)}</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4" />
                                <span>{t('Tugatish', language)}</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Earnings History */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <Award className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">{t('Daromad tarixi', language)}</h3>
            </div>
          </div>
          
          <div className="space-y-3">
            {approvedTasks.length === 0 ? (
              <div className="text-center py-8">
                <Award className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">{t('Hali daromad yo\'q', language)}</p>
              </div>
            ) : (
              approvedTasks
                .filter((task: any) => task.payment && task.payment > 0)
                .sort((a: any, b: any) => new Date(b.approvedAt || b.createdAt).getTime() - new Date(a.approvedAt || a.createdAt).getTime())
                .slice(0, 5)
                .map((task: any) => (
                  <div key={task._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div className="flex-1 min-w-0">
                      <h5 className="font-semibold text-gray-900 truncate text-sm">{task.title}</h5>
                      <p className="text-xs text-gray-600 truncate">
                        {task.car?.make} {task.car?.carModel}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-base font-bold text-green-600">
                        +{new Intl.NumberFormat('uz-UZ').format(task.payment)}
                      </p>
                    </div>
                  </div>
                ))
            )}
            
            {approvedTasks.filter((task: any) => task.payment && task.payment > 0).length === 0 && approvedTasks.length > 0 && (
              <div className="text-center py-6">
                <p className="text-gray-600 text-sm">{t('To\'lovli vazifalar yo\'q', language)}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprenticeDashboard;

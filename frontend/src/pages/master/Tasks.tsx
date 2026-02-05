import React, { useState } from 'react';
import { useTasks, useApproveTask } from '@/hooks/useTasks';
import CreateTaskModal from '@/components/CreateTaskModal';
import EditTaskModal from '@/components/EditTaskModal';
import ViewTaskModal from '@/components/ViewTaskModal';
import DeleteTaskModal from '@/components/DeleteTaskModal';
import { Task } from '@/types';
import { 
  CheckSquare, 
  Clock, 
  AlertCircle, 
  CheckCircle,
  Plus,
  Eye,
  Edit,
  Trash2,
  Car,
  Calendar,
  Search,
  Filter,
  Award,
  Zap,
  X,
  DollarSign
} from 'lucide-react';

const MasterTasks: React.FC = () => {
  const { data: tasks, isLoading, refetch } = useTasks();
  const approveTaskMutation = useApproveTask();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState('active'); // 'active' - faqat faol vazifalar
  const [searchTerm, setSearchTerm] = useState('');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-md';
      case 'high': return 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md';
      case 'medium': return 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-md';
      case 'low': return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'in-progress': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'completed': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'approved': return 'bg-green-50 text-green-700 border-green-200';
      case 'rejected': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'assigned': return <CheckSquare className="h-3.5 w-3.5" />;
      case 'in-progress': return <Clock className="h-3.5 w-3.5" />;
      case 'completed': return <AlertCircle className="h-3.5 w-3.5" />;
      case 'approved': return <CheckCircle className="h-3.5 w-3.5" />;
      case 'rejected': return <AlertCircle className="h-3.5 w-3.5" />;
      default: return <CheckSquare className="h-3.5 w-3.5" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'assigned': return 'Tayinlangan';
      case 'in-progress': return 'Jarayonda';
      case 'completed': return 'Bajarilgan';
      case 'approved': return 'Tasdiqlangan';
      case 'rejected': return 'Rad etilgan';
      default: return status;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Shoshilinch';
      case 'high': return 'Yuqori';
      case 'medium': return 'O\'rta';
      case 'low': return 'Past';
      default: return priority;
    }
  };

  const filteredTasks = (() => {
    if (filter === 'all') {
      return tasks?.tasks;
    } else if (filter === 'active') {
      // Faqat faol vazifalar (faqat tasdiqlangan o'chadi, rad etilgan qoladi)
      return tasks?.tasks?.filter((task: any) => 
        task.status !== 'approved' // Faqat tasdiqlangan vazifalar yashirin
      );
    } else {
      return tasks?.tasks?.filter((task: any) => task.status === filter);
    }
  })();

  const searchedTasks = filteredTasks?.filter((task: any) =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.assignedTo.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setIsViewModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsEditModalOpen(true);
  };

  const handleDeleteTask = (task: Task) => {
    setSelectedTask(task);
    setIsDeleteModalOpen(true);
  };

  const handleApproveTask = (task: Task) => {
    setSelectedTask(task);
    setShowApprovalModal(true);
  };

  const confirmApproval = async (approved: boolean) => {
    if (selectedTask) {
      await approveTaskMutation.mutateAsync({
        id: selectedTask._id,
        approved,
        rejectionReason: approved ? undefined : rejectionReason
      });
      setShowApprovalModal(false);
      setSelectedTask(null);
      setRejectionReason('');
    }
  };

  // These functions are used by DeleteTaskModal internally
  // const confirmDelete = async () => {
  //   if (selectedTask) {
  //     try {
  //       await deleteTaskMutation.mutateAsync(selectedTask._id);
  //       setIsDeleteModalOpen(false);
  //       setSelectedTask(null);
  //     } catch (error) {
  //       console.error('Delete task error:', error);
  //       setIsDeleteModalOpen(false);
  //       setSelectedTask(null);
  //     }
  //   }
  // };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-2 sm:p-6 pb-20">
      <div className="max-w-7xl mx-auto space-y-3 sm:space-y-6 animate-fade-in">
        {/* Mobile-First Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
              Vazifalar
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              {tasks?.tasks?.length || 0} ta vazifa mavjud
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary group w-full sm:w-auto py-3 sm:py-2"
          >
            <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
            <span className="font-semibold">Yangi vazifa</span>
          </button>
        </div>

        {/* Responsive Statistics */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:grid-cols-4">
          <div className="stats-card-primary animate-slide-up">
            <div className="flex flex-col sm:flex-row items-center sm:items-start sm:justify-between mb-3 sm:mb-4">
              <div className="bg-white/20 p-2 sm:p-3 rounded-xl backdrop-blur-sm mb-2 sm:mb-0">
                <CheckSquare className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="text-center sm:text-right">
                <p className="text-2xl sm:text-4xl font-bold">
                  {tasks?.tasks?.filter((task: any) => task.status === 'assigned').length || 0}
                </p>
                <p className="text-xs sm:text-sm text-blue-100 mt-1 hidden sm:block">+12% bu hafta</p>
              </div>
            </div>
            <p className="text-white/90 font-semibold text-sm sm:text-base text-center sm:text-left">Tayinlangan</p>
          </div>

          <div className="stats-card-warning animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex flex-col sm:flex-row items-center sm:items-start sm:justify-between mb-3 sm:mb-4">
              <div className="bg-white/20 p-2 sm:p-3 rounded-xl backdrop-blur-sm mb-2 sm:mb-0">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="text-center sm:text-right">
                <p className="text-2xl sm:text-4xl font-bold">
                  {tasks?.tasks?.filter((task: any) => task.status === 'in-progress').length || 0}
                </p>
                <p className="text-xs sm:text-sm text-amber-100 mt-1 hidden sm:block">Faol</p>
              </div>
            </div>
            <p className="text-white/90 font-semibold text-sm sm:text-base text-center sm:text-left">Jarayonda</p>
          </div>

          <div className="card p-4 sm:p-6 bg-gradient-to-br from-orange-500 to-red-500 text-white hover:scale-105 transition-all duration-300 cursor-pointer animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex flex-col sm:flex-row items-center sm:items-start sm:justify-between mb-3 sm:mb-4">
              <div className="bg-white/20 p-2 sm:p-3 rounded-xl backdrop-blur-sm mb-2 sm:mb-0">
                <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="text-center sm:text-right">
                <p className="text-2xl sm:text-4xl font-bold">
                  {tasks?.tasks?.filter((task: any) => task.status === 'completed').length || 0}
                </p>
                <p className="text-xs sm:text-sm text-orange-100 mt-1 hidden sm:block">Tekshirish kerak</p>
              </div>
            </div>
            <p className="text-white/90 font-semibold text-sm sm:text-base text-center sm:text-left">Kutilmoqda</p>
          </div>

          <div className="stats-card-success animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex flex-col sm:flex-row items-center sm:items-start sm:justify-between mb-3 sm:mb-4">
              <div className="bg-white/20 p-2 sm:p-3 rounded-xl backdrop-blur-sm mb-2 sm:mb-0">
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="text-center sm:text-right">
                <p className="text-2xl sm:text-4xl font-bold">
                  {tasks?.tasks?.filter((task: any) => task.status === 'approved').length || 0}
                </p>
                <p className="text-xs sm:text-sm text-green-100 mt-1 hidden sm:block">+18% bu hafta</p>
              </div>
            </div>
            <p className="text-white/90 font-semibold text-sm sm:text-base text-center sm:text-left">Tasdiqlangan</p>
          </div>
        </div>

        {/* Mobile-First Search and Filter */}
        <div className="card-gradient p-3 sm:p-6">
          {/* Search */}
          <div className="relative mb-3 sm:mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 text-sm w-full"
            />
          </div>

          {/* Filter Select - Mobile Optimized */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-600 font-semibold">
              <Filter className="h-4 w-4" />
              <span className="text-sm">Filter:</span>
            </div>
            <div className="relative">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-4 py-3 text-sm font-semibold bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer shadow-sm hover:shadow-md transition-all duration-200"
              >
                <option value="active">
                  Faol vazifalar ({tasks?.tasks?.filter((t: any) => t.status !== 'approved').length || 0})
                </option>
                <option value="all">
                  Barchasi ({tasks?.tasks?.length || 0})
                </option>
                <option value="assigned">
                  Tayinlangan ({tasks?.tasks?.filter((t: any) => t.status === 'assigned').length || 0})
                </option>
                <option value="in-progress">
                  Jarayonda ({tasks?.tasks?.filter((t: any) => t.status === 'in-progress').length || 0})
                </option>
                <option value="completed">
                  Kutilmoqda ({tasks?.tasks?.filter((t: any) => t.status === 'completed').length || 0})
                </option>
                <option value="approved">
                  Tasdiqlangan ({tasks?.tasks?.filter((t: any) => t.status === 'approved').length || 0})
                </option>
                <option value="rejected">
                  Rad etilgan ({tasks?.tasks?.filter((t: any) => t.status === 'rejected').length || 0})
                </option>
              </select>
              {/* Custom dropdown arrow */}
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Responsive Tasks Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {searchedTasks?.map((task: any) => (
            <div
              key={task._id}
              className="card hover:shadow-lg transition-all duration-300 overflow-hidden group"
            >
              {/* Task Header */}
              <div className="p-4 sm:p-5 space-y-3">
                <div className="flex items-start justify-between gap-2 sm:gap-3">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors flex-1 line-clamp-2">
                    {task.title}
                  </h3>
                  <span className={`px-2 sm:px-2.5 py-1 text-xs font-bold rounded-lg ${getPriorityColor(task.priority)} flex items-center gap-1 shrink-0`}>
                    <Zap className="h-3 w-3" />
                    <span className="hidden sm:inline">{getPriorityText(task.priority)}</span>
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
                
                <div className="space-y-2">
                  {/* Shogirdlar ro'yxati */}
                  {task.assignments && task.assignments.length > 0 ? (
                    <div className="space-y-1.5">
                      {task.assignments.map((assignment: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 bg-blue-50 px-2.5 py-1.5 rounded-lg">
                          <div className="h-5 w-5 sm:h-6 sm:w-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {assignment.apprentice?.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <span className="font-semibold text-gray-900 text-sm truncate flex-1">
                            {assignment.apprentice?.name || 'Noma\'lum'}
                          </span>
                          {assignment.earning > 0 && (
                            <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded">
                              {assignment.earning.toLocaleString()} so'm
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-blue-50 px-2.5 py-1.5 rounded-lg">
                      <div className="h-5 w-5 sm:h-6 sm:w-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {task.assignedTo?.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <span className="font-semibold text-gray-900 text-sm truncate">{task.assignedTo?.name || 'Noma\'lum'}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 bg-purple-50 px-2.5 py-1.5 rounded-lg">
                    <Car className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                    <span className="font-semibold text-gray-900 text-sm truncate">
                      {task.car ? `${task.car.make} ${task.car.carModel}` : 'Mashina tanlanmagan'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
                  <span className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg font-semibold border ${getStatusColor(task.status)}`}>
                    {getStatusIcon(task.status)}
                    <span className="hidden sm:inline">{getStatusText(task.status)}</span>
                  </span>
                  <div className="flex items-center gap-1 text-gray-600 bg-gray-50 px-2 sm:px-2.5 py-1 rounded-lg">
                    <Clock className="h-3 w-3" />
                    <span className="font-medium">{task.estimatedHours}s</span>
                  </div>
                  {(() => {
                    // Umumiy shogirdlar pulini hisoblash
                    let totalApprenticeEarning = 0;
                    
                    if (task.assignments && task.assignments.length > 0) {
                      totalApprenticeEarning = task.assignments.reduce((sum: number, a: any) => sum + (a.earning || 0), 0);
                    } else if (task.apprenticeEarning) {
                      totalApprenticeEarning = task.apprenticeEarning;
                    }
                    
                    if (totalApprenticeEarning > 0) {
                      return (
                        <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 sm:px-2.5 py-1 rounded-lg">
                          <DollarSign className="h-3 w-3" />
                          <span className="font-medium">{totalApprenticeEarning.toLocaleString()}</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  <div className="flex items-center gap-1 text-gray-600 bg-gray-50 px-2 sm:px-2.5 py-1 rounded-lg">
                    <Calendar className="h-3 w-3" />
                    <span className="font-medium hidden sm:inline">{new Date(task.createdAt).toLocaleDateString('uz-UZ')}</span>
                    <span className="font-medium sm:hidden">{new Date(task.createdAt).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' })}</span>
                  </div>
                </div>
              </div>

              {/* Task Footer - Responsive */}
              <div className="px-4 sm:px-5 py-3 bg-gradient-to-r from-gray-50 to-blue-50/30 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <button 
                    onClick={() => handleViewTask(task)}
                    className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" 
                    title="Ko'rish"
                  >
                    <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                  <button 
                    onClick={() => handleEditTask(task)}
                    className="p-1.5 sm:p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" 
                    title="Tahrirlash"
                  >
                    <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                  {task.status === 'completed' && (
                    <button 
                      onClick={() => handleApproveTask(task)}
                      className="p-1.5 sm:p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors" 
                      title="Tasdiqlash/Rad etish"
                    >
                      <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                  )}
                  <button 
                    onClick={() => handleDeleteTask(task)}
                    className="p-1.5 sm:p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors" 
                    title="O'chirish"
                  >
                    <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                </div>
                {task.status === 'approved' && (
                  <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                    <Award className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State - Responsive */}
        {searchedTasks?.length === 0 && (
          <div className="card-gradient p-8 sm:p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="h-20 w-20 sm:h-24 sm:w-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <CheckSquare className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">Vazifalar topilmadi</h3>
              <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base">Birinchi vazifani yaratish uchun quyidagi tugmani bosing</p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="btn-primary btn-lg w-full sm:w-auto"
              >
                <Plus className="h-5 w-5 mr-2" />
                Vazifa yaratish
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Edit Task Modal */}
      <EditTaskModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        onUpdate={() => refetch()}
      />

      {/* View Task Modal */}
      <ViewTaskModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
      />

      {/* Delete Task Modal */}
      <DeleteTaskModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
      />

      {/* Task Approval Modal */}
      {showApprovalModal && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Vazifani tasdiqlash</h3>
                </div>
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="text-white/80 hover:text-white p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 p-4 rounded-xl">
                <h4 className="font-bold text-gray-900 mb-2">{selectedTask.title}</h4>
                <p className="text-sm text-gray-600 mb-3">{selectedTask.description}</p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold">Shogird:</span>
                  <span>{selectedTask.assignedTo.name}</span>
                </div>
                {selectedTask.payment && selectedTask.payment > 0 && (
                  <div className="flex items-center gap-2 text-sm mt-2 bg-green-50 p-2 rounded-lg">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="font-semibold text-green-800">
                      To'lov: {selectedTask.payment.toLocaleString()} so'm
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Rad etish sababi (ixtiyoriy):
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Agar rad etsangiz, sababini yozing..."
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => confirmApproval(false)}
                disabled={approveTaskMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {approveTaskMutation.isPending ? 'Saqlanmoqda...' : 'Rad etish'}
              </button>
              <button
                onClick={() => confirmApproval(true)}
                disabled={approveTaskMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {approveTaskMutation.isPending ? 'Saqlanmoqda...' : 'Tasdiqlash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterTasks;

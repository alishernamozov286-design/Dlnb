import React from 'react';
import { X, Car as CarIcon, User, Calendar, Package, ClipboardList, Users, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Car } from '@/types';
import { formatCurrency, safeFormatDate, safeFormatDateTime } from '@/lib/utils';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useTasks } from '@/hooks/useTasks';
import { t } from '@/lib/transliteration';

interface ViewCarModalProps {
  isOpen: boolean;
  onClose: () => void;
  car: Car;
  onEdit: () => void;
  onDelete: () => void;
}

const ViewCarModal: React.FC<ViewCarModalProps> = ({ isOpen, onClose, car, onEdit, onDelete }) => {
  // localStorage'dan tilni o'qish
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language'); 
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);
  
  // Modal ochilganda body scroll ni bloklash
  useBodyScrollLock(isOpen);
  
  // Vazifalarni yuklash
  const { data: tasksData } = useTasks({ car: car._id });
  const tasks = tasksData?.tasks || [];
  
  // Unique shogirdlarni olish
  const apprentices = React.useMemo(() => {
    const apprenticeMap = new Map();
    tasks.forEach((task: any) => {
      task.assignments?.forEach((assignment: any) => {
        if (assignment.apprentice && assignment.apprentice._id) {
          apprenticeMap.set(assignment.apprentice._id, assignment.apprentice);
        }
      });
    });
    return Array.from(apprenticeMap.values());
  }, [tasks]);
  
  if (!isOpen) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'delivered': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'needed': return 'bg-red-100 text-red-800 border-red-200';
      case 'ordered': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'available': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'installed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Unused functions - commented out to avoid build errors
  // const getStatusIcon = (status: string) => {
  //   switch (status) {
  //     case 'pending': return <AlertCircle className="h-4 w-4" />;
  //     case 'in-progress': return <Clock className="h-4 w-4" />;
  //     case 'completed': return <CheckCircle className="h-4 w-4" />;
  //     case 'delivered': return <Truck className="h-4 w-4" />;
  //     default: return <AlertCircle className="h-4 w-4" />;
  //   }
  // };

  // const getStatusButtonConfig = (status: string) => {
  //   switch (status) {
  //     case 'pending': 
  //       return { 
  //         bg: 'bg-yellow-600 hover:bg-yellow-700', 
  //         text: t('Kutilmoqda', language),
  //         icon: <AlertCircle className="h-4 w-4" />
  //       };
  //     case 'in-progress': 
  //       return { 
  //         bg: 'bg-blue-600 hover:bg-blue-700', 
  //         text: t('Jarayonda', language),
  //         icon: <Clock className="h-4 w-4" />
  //       };
  //     case 'completed': 
  //       return { 
  //         bg: 'bg-green-600 hover:bg-green-700', 
  //         text: t('Tayyor', language),
  //         icon: <CheckCircle className="h-4 w-4" />
  //       };
  //     case 'delivered': 
  //       return { 
  //         bg: 'bg-gray-600 hover:bg-gray-700', 
  //         text: t('Topshirilgan', language),
  //         icon: <Truck className="h-4 w-4" />
  //       };
  //     default: 
  //       return { 
  //         bg: 'bg-gray-600 hover:bg-gray-700', 
  //         text: status,
  //         icon: <AlertCircle className="h-4 w-4" />
  //       };
  //   }
  // };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return t('Kutilmoqda', language);
      case 'in-progress': return t('Jarayonda', language);
      case 'completed': return t('Tayyor', language);
      case 'delivered': return t('Topshirilgan', language);
      case 'needed': return t('Kerak', language);
      case 'ordered': return t('Buyurtma qilingan', language);
      case 'available': return t('Mavjud', language);
      case 'installed': return t("O'rnatilgan", language);
      default: return status;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 px-3 sm:px-4 py-2.5 sm:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <div className="bg-white/20 backdrop-blur-sm p-1.5 rounded-lg">
                <CarIcon className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm sm:text-base font-semibold text-white truncate">
                  {car.make} {car.carModel}
                </h2>
                <p className="text-white/80 text-xs truncate">{car.licensePlate}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition-all flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-3 sm:p-4">
          {/* Main Info Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 sm:gap-3 mb-3 sm:mb-4">
            {/* Mashina ma'lumotlari */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-2.5 sm:p-3 border border-blue-100">
              <h3 className="text-xs font-semibold text-gray-900 mb-2 flex items-center">
                <CarIcon className="h-3 w-3 mr-1.5 text-blue-600" />
                {t('Mashina', language)}
              </h3>
              <div className="space-y-1.5">
                <div>
                  <p className="text-xs text-gray-600">{t('Marka va model', language)}</p>
                  <p className="text-xs font-medium text-gray-900 truncate">{car.make} {car.carModel}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">{t('Yili', language)}</p>
                  <p className="text-xs font-medium text-gray-900">{car.year}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">{t('Davlat raqami', language)}</p>
                  <p className="text-xs font-medium text-gray-900">{car.licensePlate}</p>
                </div>
              </div>
            </div>

            {/* Egasi ma'lumotlari */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-2.5 sm:p-3 border border-green-100">
              <h3 className="text-xs font-semibold text-gray-900 mb-2 flex items-center">
                <User className="h-3 w-3 mr-1.5 text-green-600" />
                {t('Egasi', language)}
              </h3>
              <div className="space-y-1.5">
                <div>
                  <p className="text-xs text-gray-600">{t('Ism', language)}</p>
                  <p className="text-xs font-medium text-gray-900 truncate">{car.ownerName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">{t('Telefon', language)}</p>
                  <p className="text-xs font-medium text-gray-900">{car.ownerPhone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">{t('Umumiy narx', language)}</p>
                  <p className="text-sm font-bold text-green-600">{formatCurrency(car.totalEstimate)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Ehtiyot qismlar */}
          {car.parts && car.parts.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 mb-3 sm:mb-4">
              <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                <h3 className="text-xs font-semibold text-gray-900 flex items-center">
                  <Package className="h-3 w-3 mr-1.5 text-blue-600" />
                  {t('Ehtiyot qismlar', language)}
                  <span className="ml-2 bg-blue-100 text-blue-600 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                    {car.parts.length}
                  </span>
                </h3>
              </div>
              <div className="p-2.5 sm:p-3">
                <div className="space-y-1.5">
                  {car.parts.map((part, index) => (
                    <div 
                      key={part._id || index} 
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all space-y-1.5 sm:space-y-0"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">{part.name}</p>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <span className="text-xs text-gray-500">
                            {part.quantity} {t('dona', language)}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">
                            {formatCurrency(part.price)} / {t('dona', language)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end space-x-2 sm:ml-3">
                        <div className="text-left sm:text-right">
                          <p className="text-xs text-gray-500">{t('Jami', language)}</p>
                          <p className="text-xs font-bold text-gray-900">
                            {formatCurrency(part.price * part.quantity)}
                          </p>
                        </div>
                        <span className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full border ${getStatusColor(part.status)}`}>
                          {getStatusText(part.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {/* Total */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-2 mt-2 border border-blue-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-700">{t('Jami narx:', language)}</span>
                      <span className="text-sm font-bold text-blue-600">
                        {formatCurrency(car.parts.reduce((sum, part) => sum + (part.price * part.quantity), 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Vazifalar bo'limi - YANGI */}
          {tasks.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 mb-3 sm:mb-4">
              <div className="px-3 py-2 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50 rounded-t-lg">
                <h3 className="text-xs font-semibold text-gray-900 flex items-center">
                  <ClipboardList className="h-3 w-3 mr-1.5 text-orange-600" />
                  {t('Vazifalar', language)}
                  <span className="ml-2 bg-orange-100 text-orange-600 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                    {tasks.length}
                  </span>
                </h3>
              </div>
              <div className="p-2.5 sm:p-3">
                {/* Shogirdlar */}
                {apprentices.length > 0 && (
                  <div className="mb-3 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                    <div className="flex items-center space-x-2 mb-2">
                      <Users className="h-3 w-3 text-blue-600" />
                      <span className="text-xs font-semibold text-blue-700">{t('Shogirdlar', language)}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {apprentices.map((apprentice: any) => (
                        <div
                          key={apprentice._id}
                          className="inline-flex items-center px-2 py-1 bg-white border border-blue-200 rounded-lg text-xs font-medium text-blue-700 shadow-sm"
                        >
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold mr-1.5">
                            {apprentice.name.charAt(0).toUpperCase()}
                          </div>
                          {apprentice.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Vazifalar ro'yxati */}
                <div className="space-y-2">
                  {tasks.map((task: any, index: number) => {
                    const getTaskStatusColor = (status: string) => {
                      switch (status) {
                        case 'assigned': return 'bg-blue-50 text-blue-700 border-blue-200';
                        case 'in-progress': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
                        case 'completed': return 'bg-green-50 text-green-700 border-green-200';
                        case 'approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
                        case 'rejected': return 'bg-red-50 text-red-700 border-red-200';
                        default: return 'bg-gray-50 text-gray-700 border-gray-200';
                      }
                    };

                    const getTaskStatusIcon = (status: string) => {
                      switch (status) {
                        case 'assigned': return <AlertCircle className="h-3 w-3" />;
                        case 'in-progress': return <Clock className="h-3 w-3" />;
                        case 'completed': 
                        case 'approved': return <CheckCircle className="h-3 w-3" />;
                        default: return <AlertCircle className="h-3 w-3" />;
                      }
                    };

                    const getTaskStatusText = (status: string) => {
                      switch (status) {
                        case 'assigned': return t('Berilgan', language);
                        case 'in-progress': return t('Jarayonda', language);
                        case 'completed': return t('Tugallangan', language);
                        case 'approved': return t('Tasdiqlangan', language);
                        case 'rejected': return t('Rad etilgan', language);
                        default: return status;
                      }
                    };

                    return (
                      <div 
                        key={task._id || index}
                        className="p-2.5 bg-gradient-to-r from-gray-50 to-orange-50/30 rounded-lg border border-gray-200 hover:border-orange-300 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-semibold text-gray-900 truncate">{task.title}</h4>
                            {task.description && (
                              <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{task.description}</p>
                            )}
                          </div>
                          <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full border ml-2 flex-shrink-0 ${getTaskStatusColor(task.status)}`}>
                            {getTaskStatusIcon(task.status)}
                            <span className="ml-1">{getTaskStatusText(task.status)}</span>
                          </span>
                        </div>

                        {/* Vazifa tafsilotlari */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {task.payment > 0 && (
                            <div className="flex items-center space-x-1">
                              <span className="text-gray-500">{t('To\'lov:', language)}</span>
                              <span className="font-semibold text-green-600">{formatCurrency(task.payment)}</span>
                            </div>
                          )}
                          {task.dueDate && (
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-600">
                                {safeFormatDate(task.dueDate)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Shogirdlar (bu vazifa uchun) */}
                        {task.assignments && task.assignments.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <div className="flex flex-wrap gap-1">
                              {task.assignments.map((assignment: any, idx: number) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-1.5 py-0.5 bg-white border border-blue-200 rounded text-[10px] font-medium text-blue-700"
                                >
                                  {assignment.apprentice?.name || t('Noma\'lum', language)}
                                  {assignment.percentage && (
                                    <span className="ml-1 text-blue-500">({assignment.percentage}%)</span>
                                  )}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Vazifalar statistikasi */}
                <div className="mt-3 p-2 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-100">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-3">
                      {tasks.filter((t: any) => t.status === 'assigned').length > 0 && (
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <span className="text-blue-700 font-medium">
                            {tasks.filter((t: any) => t.status === 'assigned').length} {t('berilgan', language)}
                          </span>
                        </div>
                      )}
                      {tasks.filter((t: any) => t.status === 'in-progress').length > 0 && (
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                          <span className="text-yellow-700 font-medium">
                            {tasks.filter((t: any) => t.status === 'in-progress').length} {t('jarayonda', language)}
                          </span>
                        </div>
                      )}
                      {tasks.filter((t: any) => t.status === 'completed' || t.status === 'approved').length > 0 && (
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className="text-green-700 font-medium">
                            {tasks.filter((t: any) => t.status === 'completed' || t.status === 'approved').length} {t('tugallangan', language)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sana ma'lumotlari */}
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs text-gray-600">
              <div className="flex items-center">
                <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1.5 text-gray-400 flex-shrink-0" />
                <span className="font-medium">{t("Qo'shilgan:", language)}</span>
                <span className="ml-1 truncate">
                  {safeFormatDateTime(car.createdAt)}
                </span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1.5 text-gray-400 flex-shrink-0" />
                <span className="font-medium">{t('Yangilangan:', language)}</span>
                <span className="ml-1 truncate">
                  {safeFormatDateTime(car.updatedAt)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-3 sm:px-4 py-2.5 bg-gray-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              onClick={onDelete}
              className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all shadow-sm hover:shadow text-center"
            >
              {t("O'chirish", language)}
            </button>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-all text-center"
            >
              {t('Yopish', language)}
            </button>
            <button
              onClick={onEdit}
              className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-sm hover:shadow text-center"
            >
              {t('Tahrirlash', language)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewCarModal;

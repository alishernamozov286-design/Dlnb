import React, { useEffect, useState } from 'react';
import { X, Car, Package, DollarSign, Edit, Wrench, Box, Briefcase, FileText, Calendar, Clock, User, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { t } from '@/lib/transliteration';

interface ViewCarServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  carService: any;
  onEdit: () => void;
}

const ViewCarServiceModal: React.FC<ViewCarServiceModalProps> = ({ isOpen, onClose, carService, onEdit }) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // localStorage'dan tilni o'qish
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  useEffect(() => {
    if (isOpen && carService?.car?._id) {
      fetchTasks();
    }
  }, [isOpen, carService]);

  const fetchTasks = async () => {
    setIsLoadingTasks(true);
    try {
      const response = await fetch(`/api/tasks?car=${carService.car._id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (isUpdatingStatus) return;

    // Confirmation messages
    const confirmMessages: { [key: string]: string } = {
      'pending': t('Xizmatni "Kutilmoqda" statusiga o\'tkazasizmi?', language),
      'in-progress': t('Xizmatni "Jarayonda" statusiga o\'tkazasizmi?', language),
      'ready-for-delivery': t('Xizmatni "Tayyor" statusiga o\'tkazasizmi? Mijozga Telegram orqali xabar yuboriladi.', language),
      'delivered': t('Xizmatni "Topshirilgan" statusiga o\'tkazasizmi? Mijozga Telegram orqali rahmat xabari yuboriladi.', language)
    };

    if (!confirm(confirmMessages[newStatus] || t('Statusni o\'zgartirmoqchimisiz?', language))) {
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const response = await fetch(`/api/car-services/${carService._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        alert(t('Status muvaffaqiyatli o\'zgartirildi!', language));
        onClose();
        window.location.reload(); // Refresh to show updated status
      } else {
        const error = await response.json();
        alert(error.message || t('Xatolik yuz berdi', language));
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert(t('Xatolik yuz berdi', language));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (!isOpen || !carService) return null;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'part': return <Wrench className="h-4 w-4" />;
      case 'material': return <Box className="h-4 w-4" />;
      case 'labor': return <Briefcase className="h-4 w-4" />;
      default: return <Wrench className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'part': return 'bg-blue-100 text-blue-700';
      case 'material': return 'bg-green-100 text-green-700';
      case 'labor': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'part': return t('Ehtiyot qism', language);
      case 'material': return t('Material', language);
      case 'labor': return t('Ish haqi', language);
      default: return category;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent': return t('Shoshilinch', language);
      case 'high': return t('Yuqori', language);
      case 'medium': return t("O'rta", language);
      case 'low': return t('Past', language);
      default: return priority;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-blue-100 text-blue-700';
      case 'in-progress': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-orange-100 text-orange-700';
      case 'approved': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'assigned': return t('Tayinlangan', language);
      case 'in-progress': return t('Jarayonda', language);
      case 'completed': return t('Bajarilgan', language);
      case 'approved': return t('Tasdiqlangan', language);
      case 'rejected': return t('Rad etilgan', language);
      default: return status;
    }
  };

  const partsTotal = carService.items?.filter((item: any) => item.category === 'part').reduce((sum: number, item: any) => sum + item.price, 0) || 0;
  const laborTotal = carService.items?.filter((item: any) => item.category === 'labor').reduce((sum: number, item: any) => sum + item.price, 0) || 0;
  const materialTotal = carService.items?.filter((item: any) => item.category === 'material').reduce((sum: number, item: any) => sum + item.price, 0) || 0;

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-5 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Car className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{t('Xizmat tafsilotlari', language)}</h3>
                  <p className="text-sm text-green-100">
                    {carService.car?.make} {carService.car?.carModel}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="text-white/80 hover:text-white p-1">
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4">
            {/* Car Info */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Car className="h-5 w-5 text-blue-600" />
                <h4 className="font-bold text-blue-900">{t('Mashina', language)}</h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/60 rounded-lg p-2">
                  <p className="text-xs text-blue-600 font-medium">{t('Marka', language)}</p>
                  <p className="text-sm font-bold text-gray-900">{carService.car?.make} {carService.car?.carModel}</p>
                </div>
                <div className="bg-white/60 rounded-lg p-2">
                  <p className="text-xs text-blue-600 font-medium">{t('Yil', language)}</p>
                  <p className="text-sm font-bold text-gray-900">{carService.car?.year}</p>
                </div>
                <div className="bg-white/60 rounded-lg p-2">
                  <p className="text-xs text-blue-600 font-medium">{t('Raqam', language)}</p>
                  <p className="text-sm font-bold text-gray-900">{carService.car?.licensePlate}</p>
                </div>
                <div className="bg-white/60 rounded-lg p-2">
                  <p className="text-xs text-blue-600 font-medium">{t('Egasi', language)}</p>
                  <p className="text-sm font-bold text-gray-900">{carService.car?.ownerName}</p>
                </div>
                <div className="bg-white/60 rounded-lg p-2 col-span-2">
                  <p className="text-xs text-blue-600 font-medium">{t('Telefon', language)}</p>
                  <p className="text-sm font-bold text-gray-900">{carService.car?.ownerPhone}</p>
                </div>
              </div>
            </div>

            {/* Items List */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-gray-700" />
                  <h4 className="font-bold text-gray-900">{t('Qismlar', language)}</h4>
                </div>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                  {carService.items?.length || 0} {t('ta', language)}
                </span>
              </div>
              
              <div className="space-y-2">
                {carService.items?.map((item: any, index: number) => (
                  <div key={index} className="bg-white border-2 border-gray-100 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`p-1 rounded ${getCategoryColor(item.category)}`}>
                            {getCategoryIcon(item.category)}
                          </div>
                          <p className="font-semibold text-gray-900">{item.name}</p>
                        </div>
                        <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded-full ${getCategoryColor(item.category)}`}>
                          {getCategoryName(item.category)}
                        </span>
                      </div>
                      <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(item.price)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-green-100">{t('Jami to\'lov', language)}</p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(carService.totalPrice || 0)}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white/20 rounded-lg p-2">
                  <p className="text-xs text-green-100 font-medium">{t('Qismlar', language)}</p>
                  <p className="text-sm font-bold text-white">
                    {formatCurrency(partsTotal)}
                  </p>
                </div>
                <div className="bg-white/20 rounded-lg p-2">
                  <p className="text-xs text-green-100 font-medium">{t('Material', language)}</p>
                  <p className="text-sm font-bold text-white">
                    {formatCurrency(materialTotal)}
                  </p>
                </div>
                <div className="bg-white/20 rounded-lg p-2">
                  <p className="text-xs text-green-100 font-medium">{t('Ish haqi', language)}</p>
                  <p className="text-sm font-bold text-white">
                    {formatCurrency(laborTotal)}
                  </p>
                </div>
              </div>
            </div>

            {/* Tasks Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-700" />
                  <h4 className="font-bold text-gray-900">{t('Vazifalar', language)}</h4>
                </div>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                  {tasks.length} {t('ta', language)}
                </span>
              </div>

              {isLoadingTasks ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-600">{t('Vazifalar yuklanmoqda...', language)}</p>
                </div>
              ) : tasks.length > 0 ? (
                <div className="space-y-2">
                  {tasks.map((task: any) => (
                    <div key={task._id} className="bg-white border-2 border-gray-100 rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="h-4 w-4 text-orange-600" />
                            <p className="font-semibold text-gray-900">{task.title}</p>
                          </div>
                          {task.description && (
                            <p className="text-sm text-gray-600 mb-2 ml-6">{task.description}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-wrap ml-6">
                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-bold rounded-full ${getStatusColor(task.status)}`}>
                          {getStatusText(task.status)}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-bold rounded-full ${getPriorityColor(task.priority)}`}>
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {getPriorityText(task.priority)}
                        </span>
                        {task.assignedTo && (
                          <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                            <User className="h-3 w-3 mr-1" />
                            {typeof task.assignedTo === 'object' ? task.assignedTo.name : t('Shogird', language)}
                          </span>
                        )}
                        {task.payment > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold bg-green-100 text-green-700 rounded-full">
                            <DollarSign className="h-3 w-3 mr-1" />
                            {formatCurrency(task.payment)}
                          </span>
                        )}
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(task.dueDate).toLocaleDateString('uz-UZ')}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                          <Clock className="h-3 w-3 mr-1" />
                          {task.estimatedHours} {t('soat', language)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <FileText className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">{t('Vazifalar yo\'q', language)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 bg-gray-50 border-t rounded-b-2xl">
            {/* Status Buttons */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Hozirgi holat:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => handleStatusChange('pending')}
                  disabled={isUpdatingStatus || carService.status === 'pending'}
                  className={`px-4 py-2.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                    carService.status === 'pending'
                      ? 'bg-yellow-500 text-white cursor-default'
                      : 'bg-white border-2 border-yellow-300 text-yellow-700 hover:bg-yellow-50 disabled:opacity-50'
                  }`}
                >
                  <span className="text-lg">⏳</span>
                  <span className="text-sm">Kutilmoqda</span>
                </button>
                
                <button
                  onClick={() => handleStatusChange('in-progress')}
                  disabled={isUpdatingStatus || carService.status === 'in-progress'}
                  className={`px-4 py-2.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                    carService.status === 'in-progress'
                      ? 'bg-blue-500 text-white cursor-default'
                      : 'bg-white border-2 border-blue-300 text-blue-700 hover:bg-blue-50 disabled:opacity-50'
                  }`}
                >
                  <span className="text-lg">⚙</span>
                  <span className="text-sm">Jarayonda</span>
                </button>
                
                <button
                  onClick={() => handleStatusChange('ready-for-delivery')}
                  disabled={isUpdatingStatus || carService.status === 'ready-for-delivery'}
                  className={`px-4 py-2.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                    carService.status === 'ready-for-delivery'
                      ? 'bg-green-500 text-white cursor-default'
                      : 'bg-white border-2 border-green-300 text-green-700 hover:bg-green-50 disabled:opacity-50'
                  }`}
                >
                  <span className="text-lg">✓</span>
                  <span className="text-sm">Tayyor</span>
                </button>
                
                <button
                  onClick={() => handleStatusChange('delivered')}
                  disabled={isUpdatingStatus || carService.status === 'delivered'}
                  className={`px-4 py-2.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                    carService.status === 'delivered'
                      ? 'bg-purple-500 text-white cursor-default'
                      : 'bg-white border-2 border-purple-300 text-purple-700 hover:bg-purple-50 disabled:opacity-50'
                  }`}
                >
                  <span className="text-lg">📦</span>
                  <span className="text-sm">Topshirilgan</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-3 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
              >
                {t('Yopish', language)}
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit();
                }}
                className="px-5 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                {t('Tahrirlash', language)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewCarServiceModal;

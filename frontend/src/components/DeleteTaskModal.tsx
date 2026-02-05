import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useDeleteTask } from '@/hooks/useTasks';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { t } from '@/lib/transliteration';
import toast from 'react-hot-toast';

interface DeleteTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: any;
}

const DeleteTaskModal: React.FC<DeleteTaskModalProps> = ({ isOpen, onClose, task }) => {
  const deleteTaskMutation = useDeleteTask();
  
  // localStorage'dan tilni o'qish
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);
  
  useBodyScrollLock(isOpen);

  const handleDelete = async () => {
    try {
      await deleteTaskMutation.mutateAsync(task._id);
      toast.success(t('Vazifa o\'chirildi', language));
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('Xatolik yuz berdi', language));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="relative px-6 py-4 bg-gradient-to-r from-red-600 to-rose-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 backdrop-blur-sm p-2 rounded-xl">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {t('Vazifani o\'chirish', language)}
                </h2>
                <p className="text-xs text-white/80">
                  {t('Bu amalni qaytarib bo\'lmaydi', language)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <p className="text-sm text-gray-700 mb-2">
              {t('Quyidagi vazifani o\'chirmoqchimisiz?', language)}
            </p>
            <div className="bg-white rounded-lg p-3 border border-red-200">
              <p className="font-semibold text-gray-900">{task.title}</p>
              {task.description && (
                <p className="text-sm text-gray-600 mt-1">{task.description}</p>
              )}
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-800">
                {t('Diqqat: Bu vazifa va unga bog\'liq barcha ma\'lumotlar butunlay o\'chiriladi.', language)}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
            >
              {t('Bekor qilish', language)}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteTaskMutation.isPending}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleteTaskMutation.isPending ? t('O\'chirilmoqda...', language) : t('O\'chirish', language)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteTaskModal;

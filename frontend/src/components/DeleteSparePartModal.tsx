import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { t } from '@/lib/transliteration';

interface SparePart {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  supplier: string;
  usageCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DeleteSparePartModalProps {
  isOpen: boolean;
  onClose: () => void;
  sparePart: SparePart;
  onSuccess: () => void;
}

const DeleteSparePartModal: React.FC<DeleteSparePartModalProps> = ({ isOpen, onClose, sparePart, onSuccess }) => {
  const language = (localStorage.getItem('language') as 'latin' | 'cyrillic') || 'latin';

  if (!isOpen) return null;

  const handleDelete = () => {
    // 1. DARHOL UI'ni yangilash (optimistic update) - 0.1 sekund ichida
    onSuccess();
    onClose();
    
    // 2. Background'da API so'rovini yuborish
    const token = localStorage.getItem('token');
    fetch(`${import.meta.env.VITE_API_URL}/spare-parts/${sparePart._id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).catch(error => {
      console.error('Error deleting spare part:', error);
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="inline-block w-full max-w-md my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">{t('Zapchastni o\'chirish', language)}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="px-6 py-4">
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  {t('Ushbu zapchastni o\'chirmoqchimisiz?', language)}
                </p>
                <p className="text-lg font-semibold text-gray-900 mt-1">{sparePart.name}</p>
                {sparePart.supplier && <p className="text-xs text-gray-500">{sparePart.supplier}</p>}
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">
                {t('Bu amalni ortga qaytarib bo\'lmaydi!', language)}
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t('Bekor qilish', language)}
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              {t('O\'chirish', language)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteSparePartModal;

import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { t } from '@/lib/transliteration';

interface Booking {
  _id: string;
  customerName: string;
  licensePlate: string;
}

interface DeleteBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  onDelete: (id: string) => Promise<any>;
}

const DeleteBookingModal: React.FC<DeleteBookingModalProps> = ({ isOpen, onClose, booking, onDelete }) => {
  const [language] = useState<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  });

  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      // ⚡ INSTANT: Modal darhol yopiladi
      onClose();
      
      // Background'da o'chirish
      await onDelete(booking._id);
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('Xatolik yuz berdi', language));
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <AlertTriangle className="h-6 w-6" />
                {t('Bronni o\'chirish', language)}
              </h3>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                {t('Haqiqatan ham ushbu bronni o\'chirmoqchimisiz?', language)}
              </p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('Mijoz:', language)}</span>
                  <span className="font-semibold text-gray-900">{booking.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('Mashina:', language)}</span>
                  <span className="font-semibold text-gray-900">{booking.licensePlate}</span>
                </div>
              </div>
              <p className="text-red-600 text-sm mt-4">
                {t('Bu amalni ortga qaytarib bo\'lmaydi!', language)}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                {t('Bekor qilish', language)}
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all font-medium disabled:opacity-50"
              >
                {isDeleting ? t('O\'chirilmoqda...', language) : t('O\'chirish', language)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteBookingModal;

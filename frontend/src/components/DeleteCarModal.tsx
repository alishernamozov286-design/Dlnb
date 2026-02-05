import React, { useState } from 'react';
import { X, AlertTriangle, Car as CarIcon } from 'lucide-react';
import { Car } from '@/types';
import { useCarsNew } from '@/hooks/useCarsNew';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { t } from '@/lib/transliteration';

interface DeleteCarModalProps {
  isOpen: boolean;
  onClose: () => void;
  car: Car;
}

const DeleteCarModal: React.FC<DeleteCarModalProps> = ({ isOpen, onClose, car }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { deleteCar } = useCarsNew();
  
  // localStorage'dan tilni o'qish
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);
  
  // Modal ochilganda body scroll ni bloklash
  useBodyScrollLock(isOpen);

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      await deleteCar(car._id);
      onClose();
    } catch (error) {
      console.error('Error deleting car:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="bg-orange-600 px-6 py-5 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="bg-white bg-opacity-20 p-2 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">{t("Arxivga o'tkazish", language)}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start space-x-4 mb-6">
            <div className="flex-shrink-0">
              <div className="bg-orange-100 rounded-full p-3">
                <CarIcon className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {car.make} {car.carModel} ({car.year})
              </h3>
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium">{t('Davlat raqami:', language)}</span> {car.licensePlate}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">{t('Egasi:', language)}</span> {car.ownerName}
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  {t("Mashina arxivga o'tkaziladi", language)}
                </p>
                <p className="text-sm text-blue-800">
                  {t("Mashina arxivda saqlanadi va kerak bo'lganda ko'rishingiz mumkin. Barcha ma'lumotlar saqlanib qoladi.", language)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700">
              {t("Mashinani arxivga o'tkazmoqchimisiz?", language)}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end space-x-3 rounded-b-xl">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
          >
            {t('Bekor qilish', language)}
          </button>
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="px-5 py-2.5 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? t("Arxivga o'tkazilmoqda...", language) : t("Ha, arxivga o'tkazish", language)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteCarModal;

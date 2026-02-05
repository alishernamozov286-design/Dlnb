import React, { useState } from 'react';
import { useCarsNew } from '@/hooks/useCarsNew';
import ViewCarModal from '@/components/ViewCarModal';
import { Search, Car as CarIcon, Eye } from 'lucide-react';
import { formatCurrency, translateStatus } from '@/lib/utils';
import { Car } from '@/types';
import { t } from '@/lib/transliteration';

const ApprenticeCars: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const { cars, loading: isLoading } = useCarsNew();

  // localStorage'dan tilni o'qish
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  const filteredCars = cars.filter((car: Car) => {
    const matchesSearch = !searchTerm || 
      car.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.carModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.ownerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || car.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleViewCar = (car: Car) => {
    setSelectedCar(car);
    setIsViewModalOpen(true);
  };

  const closeModal = () => {
    setIsViewModalOpen(false);
    setSelectedCar(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string, lang: 'latin' | 'cyrillic') => {
    return translateStatus(status, lang);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('Avtomobillar', language)}</h1>
          <p className="mt-2 text-gray-600">
            {t('Avtomobillar va ularning ta\'mirlash holatini ko\'ring.', language)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('Mashinalarni qidirish...', language)}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input"
        >
          <option value="">{t('Barcha holatlar', language)}</option>
          <option value="pending">{t('Kutilmoqda', language)}</option>
          <option value="in-progress">{t('Jarayonda', language)}</option>
          <option value="completed">{t('Tayyor', language)}</option>
          <option value="delivered">{t('Topshirilgan', language)}</option>
        </select>
      </div>

      {/* Cars Grid */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">{t('Mashinalar yuklanmoqda...', language)}</p>
        </div>
      ) : filteredCars.length === 0 ? (
        <div className="text-center py-12">
          <CarIcon className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">{t('Mashinalar topilmadi', language)}</h3>
          <p className="mt-2 text-gray-600">{t('Hozircha mashinalar yo\'q.', language)}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCars.map((car: Car) => (
            <div
              key={car._id}
              className="card p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                    <CarIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {car.make} {car.carModel}
                    </h3>
                    <p className="text-sm text-gray-600">{car.year}</p>
                  </div>
                </div>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(car.status)}`}>
                  {getStatusText(car.status, language)}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{t('Davlat raqami:', language)}</span>
                  <span className="font-medium">{car.licensePlate}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{t('Egasi:', language)}</span>
                  <span className="font-medium">{car.ownerName}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{t('Qismlar:', language)}</span>
                  <span className="font-medium">{car.parts.length} ta</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{t('Narx:', language)}</span>
                  <span className="font-medium">{formatCurrency(car.totalEstimate, language)}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-end">
                  <button 
                    onClick={() => handleViewCar(car)}
                    className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded-lg transition-colors flex items-center"
                    title={t('Ko\'rish', language)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {t('Ko\'rish', language)}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Modal */}
      {selectedCar && (
        <ViewCarModal
          isOpen={isViewModalOpen}
          onClose={closeModal}
          car={selectedCar}
          onEdit={() => {}}
          onDelete={() => {}}
        />
      )}
    </div>
  );
};

export default ApprenticeCars;

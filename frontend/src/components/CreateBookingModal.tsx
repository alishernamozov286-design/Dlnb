import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Calendar, Phone, Car, User } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { t } from '@/lib/transliteration';

interface CreateBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateBookingModal: React.FC<CreateBookingModalProps> = ({ isOpen, onClose }) => {
  const [language] = useState<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  });

  const [formData, setFormData] = useState({
    customerName: '',
    phoneNumber: '',
    licensePlate: '',
    bookingDate: '',
    birthDate: '', // Tug'ilgan kun
  });

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await api.post('/bookings', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking-stats'] });
      toast.success(t('Bron muvaffaqiyatli yaratildi', language));
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || t('Xatolik yuz berdi', language));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerName || !formData.phoneNumber || !formData.licensePlate || !formData.bookingDate) {
      toast.error(t('Barcha majburiy maydonlarni to\'ldiring', language));
      return;
    }

    createMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'phoneNumber') {
      // Telefon raqamini formatlash
      const formatted = formatPhoneNumber(value);
      setFormData({
        ...formData,
        phoneNumber: formatted,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Faqat raqamlarni qoldirish
    const phoneNumber = value.replace(/\D/g, '');
    
    // Agar 998 bilan boshlanmasa, avtomatik qo'shish
    let formattedNumber = phoneNumber;
    if (!phoneNumber.startsWith('998') && phoneNumber.length > 0) {
      formattedNumber = '998' + phoneNumber;
    }
    
    // Formatni qo'llash: +998 XX XXX XX XX
    if (formattedNumber.length >= 3) {
      let formatted = '+998';
      if (formattedNumber.length > 3) {
        formatted += ' ' + formattedNumber.slice(3, 5);
      }
      if (formattedNumber.length > 5) {
        formatted += ' ' + formattedNumber.slice(5, 8);
      }
      if (formattedNumber.length > 8) {
        formatted += ' ' + formattedNumber.slice(8, 10);
      }
      if (formattedNumber.length > 10) {
        formatted += ' ' + formattedNumber.slice(10, 12);
      }
      return formatted;
    }
    
    return formattedNumber.length > 0 ? '+' + formattedNumber : '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Calendar className="h-6 w-6" />
                {t('Yangi bron yaratish', language)}
              </h3>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
            {/* Customer Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="h-4 w-4 inline mr-1" />
                {t('Mijoz ismi', language)} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('Mijoz ismini kiriting', language)}
                required
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="h-4 w-4 inline mr-1" />
                {t('Telefon raqam', language)} <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+998 90 123 45 67"
                required
              />
            </div>

            {/* License Plate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Car className="h-4 w-4 inline mr-1" />
                {t('Davlat raqami', language)} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="licensePlate"
                value={formData.licensePlate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                placeholder="01 A 123 BC"
                required
              />
            </div>

            {/* Booking Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                {t('Bron sanasi', language)} <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="bookingDate"
                value={formData.bookingDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Birth Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                {t('Tug\'ilgan kun', language)}
              </label>
              <input
                type="date"
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                {t('Bekor qilish', language)}
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium disabled:opacity-50"
              >
                {createMutation.isPending ? t('Saqlanmoqda...', language) : t('Saqlash', language)}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateBookingModal;

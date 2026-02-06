import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Phone, Car, Plus, Edit2, Trash2, Clock, Gift, Cake, PartyPopper, Sparkles } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { t } from '@/lib/transliteration';
import LoadingSpinner from '@/components/LoadingSpinner';
import CreateBookingModal from '../../components/CreateBookingModal';
import EditBookingModal from '../../components/EditBookingModal';
import DeleteBookingModal from '../../components/DeleteBookingModal';
import BirthdaySmsModal from '../../components/BirthdaySmsModal';

interface Booking {
  _id: string;
  customerName: string;
  phoneNumber: string;
  licensePlate: string;
  bookingDate: string;
  birthDate?: string; // Tug'ilgan kun
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdBy: {
    _id: string;
    name: string;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
}

const Bookings: React.FC = () => {
  const [language] = useState<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBirthdaySmsModalOpen, setIsBirthdaySmsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const queryClient = useQueryClient();

  // Tug'ilgan kungacha qolgan kunlarni hisoblash
  const getDaysUntilBirthday = (birthDate?: string) => {
    if (!birthDate) return null;

    const today = new Date();
    const birth = new Date(birthDate);
    
    // Bugungi yilga tug'ilgan kunni o'tkazish
    const thisYearBirthday = new Date(
      today.getFullYear(),
      birth.getMonth(),
      birth.getDate()
    );

    // Agar bu yilgi tug'ilgan kun o'tib ketgan bo'lsa, keyingi yilga o'tkazish
    if (thisYearBirthday < today) {
      thisYearBirthday.setFullYear(today.getFullYear() + 1);
    }

    // Kunlar farqini hisoblash
    const diffTime = thisYearBirthday.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  // Fetch bookings
  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const response = await api.get('/bookings');
      return response.data;
    },
  });

  const bookings = bookingsData?.bookings || [];

  // Mijozlarni qidirish
  const filteredBookings = bookings.filter((booking: Booking) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      booking.customerName.toLowerCase().includes(query) ||
      booking.phoneNumber.toLowerCase().includes(query) ||
      booking.licensePlate.toLowerCase().includes(query)
    );
  });

  // Bronlarni tug'ilgan kun bo'yicha saralash
  const sortedBookings = [...filteredBookings].sort((a, b) => {
    const daysA = getDaysUntilBirthday(a.birthDate);
    const daysB = getDaysUntilBirthday(b.birthDate);

    // Tug'ilgan kuni 0-2 kun oralig'ida bo'lganlarni eng yuqoriga
    if (daysA !== null && daysA >= 0 && daysA <= 2) {
      if (daysB !== null && daysB >= 0 && daysB <= 2) {
        return daysA - daysB; // Ikkalasi ham 0-2 oralig'ida bo'lsa, kamroq kunni yuqoriga
      }
      return -1; // A yuqorida
    }
    if (daysB !== null && daysB >= 0 && daysB <= 2) {
      return 1; // B yuqorida
    }

    return 0; // Qolganlarini o'zgartirmaslik
  });

  // Update booking status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await api.put(`/bookings/${id}`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking-stats'] });
      toast.success(t('Status yangilandi', language));
    },
    onError: () => {
      toast.error(t('Xatolik yuz berdi', language));
    },
  });

  const handleSendBirthdaySms = (booking: Booking) => {
    if (!booking.phoneNumber) {
      toast.error(t('Telefon raqam mavjud emas', language));
      return;
    }
    
    setSelectedBooking(booking);
    setIsBirthdaySmsModalOpen(true);
  };

  const handleEdit = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsEditModalOpen(true);
  };

  const handleDelete = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsDeleteModalOpen(true);
  };

  const handleStatusChange = (id: string, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header with Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('Mijozlar bronlari', language)}</h1>
          <p className="text-gray-600 mt-1">{t('Mijozlar bronlarini boshqaring', language)}</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:flex-initial sm:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('Mijoz, telefon yoki raqam...', language)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          
          {/* Add Button */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl whitespace-nowrap"
          >
            <Plus className="h-5 w-5" />
            {t('Yangi bron', language)}
          </button>
        </div>
      </div>

      {/* Bookings List - Compact Card View */}
      {sortedBookings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-base font-medium">
            {searchQuery ? t('Qidiruv natijasi topilmadi', language) : t('Bronlar topilmadi', language)}
          </p>
          {searchQuery && (
            <p className="text-gray-400 text-sm mt-2">
              "{searchQuery}" bo'yicha natija yo'q
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedBookings.map((booking: Booking) => {
            const daysUntilBirthday = getDaysUntilBirthday(booking.birthDate);
            const isBirthdaySoon = daysUntilBirthday !== null && daysUntilBirthday >= 0 && daysUntilBirthday <= 2;

            return (
              <div
                key={booking._id}
                className={`group relative bg-white rounded-xl shadow-sm border-2 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
                  isBirthdaySoon 
                    ? 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-white' 
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                {/* Birthday Badge */}
                {isBirthdaySoon && (
                  <div className="absolute -top-3 -right-3 z-10">
                    <div className="relative group/badge">
                      {/* Glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 rounded-full blur-lg animate-pulse opacity-75"></div>
                      
                      {/* Badge */}
                      <div className="relative bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500 text-white rounded-full p-2.5 shadow-2xl transform group-hover/badge:scale-110 transition-all duration-300">
                        {daysUntilBirthday === 0 ? (
                          <PartyPopper className="h-5 w-5 animate-bounce" />
                        ) : daysUntilBirthday === 1 ? (
                          <Cake className="h-5 w-5 animate-pulse" />
                        ) : (
                          <Sparkles className="h-5 w-5" />
                        )}
                      </div>
                      
                      {/* Tooltip */}
                      <div className="absolute top-full right-0 mt-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover/badge:opacity-100 group-hover/badge:visible transition-all duration-200 whitespace-nowrap shadow-xl">
                        <div className="flex items-center gap-1.5">
                          {daysUntilBirthday === 0 ? (
                            <>
                              <PartyPopper className="h-3.5 w-3.5" />
                              <span>Bugun tug'ilgan kun!</span>
                            </>
                          ) : (
                            <>
                              <Cake className="h-3.5 w-3.5" />
                              <span>{daysUntilBirthday} kun qoldi</span>
                            </>
                          )}
                        </div>
                        <div className="absolute bottom-full right-4 border-4 border-transparent border-b-gray-900"></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Card Content */}
                <div className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-bold text-gray-900 truncate">
                          {booking.customerName}
                        </h3>
                        {isBirthdaySoon && (
                          <div className="flex items-center gap-1">
                            {daysUntilBirthday === 0 ? (
                              <PartyPopper className="h-5 w-5 text-pink-500 animate-bounce" />
                            ) : (
                              <Cake className="h-5 w-5 text-orange-500 animate-pulse" />
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Phone className="h-3 w-3" />
                        <span className="font-medium truncate">{booking.phoneNumber}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <select
                    value={booking.status}
                    onChange={(e) => handleStatusChange(booking._id, e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-lg text-xs font-bold border-2 cursor-pointer ${getStatusColor(booking.status)}`}
                  >
                    <option value="pending">{t('Kutilmoqda', language)}</option>
                    <option value="confirmed">{t('Tasdiqlangan', language)}</option>
                    <option value="completed">{t('Bajarilgan', language)}</option>
                    <option value="cancelled">{t('Bekor qilingan', language)}</option>
                  </select>

                  {/* Info Grid */}
                  <div className="space-y-2">
                    {/* License Plate */}
                    <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-100">
                      <Car className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <span className="text-xs font-bold text-gray-900 truncate">{booking.licensePlate}</span>
                    </div>

                    {/* Booking Date */}
                    <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg border border-purple-100">
                      <Calendar className="h-4 w-4 text-purple-600 flex-shrink-0" />
                      <span className="text-xs font-medium text-gray-900 truncate">{formatDate(booking.bookingDate)}</span>
                    </div>

                    {/* Birth Date */}
                    {booking.birthDate && (
                      <div className={`relative flex items-center gap-2 p-2 rounded-lg border overflow-hidden ${
                        isBirthdaySoon 
                          ? 'bg-gradient-to-r from-yellow-100 via-orange-100 to-pink-100 border-yellow-300' 
                          : 'bg-green-50 border-green-100'
                      }`}>
                        {/* Animated background for birthday soon */}
                        {isBirthdaySoon && (
                          <div className="absolute inset-0 bg-gradient-to-r from-yellow-200/50 via-orange-200/50 to-pink-200/50 animate-pulse"></div>
                        )}
                        
                        <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-lg ${
                          isBirthdaySoon ? 'bg-gradient-to-br from-orange-400 to-pink-500' : 'bg-green-500'
                        } shadow-md`}>
                          {isBirthdaySoon ? (
                            daysUntilBirthday === 0 ? (
                              <PartyPopper className="h-4 w-4 text-white animate-bounce" />
                            ) : (
                              <Cake className="h-4 w-4 text-white" />
                            )
                          ) : (
                            <Gift className="h-4 w-4 text-white" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0 relative z-10">
                          <span className="text-xs font-medium text-gray-900 truncate block">{formatDate(booking.birthDate)}</span>
                          {isBirthdaySoon && (
                            <div className="flex items-center gap-1 mt-0.5">
                              {daysUntilBirthday === 0 ? (
                                <>
                                  <Sparkles className="h-3 w-3 text-pink-600" />
                                  <span className="text-xs font-bold text-pink-600">Bugun!</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="h-3 w-3 text-orange-600" />
                                  <span className="text-xs font-bold text-orange-600">{daysUntilBirthday} kun qoldi</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    {isBirthdaySoon && (
                      <button
                        onClick={() => handleSendBirthdaySms(booking)}
                        className="flex-1 relative overflow-hidden flex items-center justify-center gap-1.5 px-3 py-2 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white rounded-lg text-xs font-bold shadow-lg hover:shadow-xl transition-all group"
                      >
                        {/* Animated shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        
                        <Gift className="h-4 w-4 relative z-10 group-hover:scale-110 transition-transform" />
                        <span className="relative z-10">SMS</span>
                        
                        {/* Sparkle effect */}
                        <Sparkles className="h-3 w-3 relative z-10 animate-pulse" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(booking)}
                      className={`${isBirthdaySoon ? '' : 'flex-1'} flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs font-semibold transition-all`}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      {!isBirthdaySoon && t('Tahrirlash', language)}
                    </button>
                    <button
                      onClick={() => handleDelete(booking)}
                      className={`${isBirthdaySoon ? '' : 'flex-1'} flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-xs font-semibold transition-all`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {!isBirthdaySoon && t('O\'chirish', language)}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {isCreateModalOpen && (
        <CreateBookingModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}

      {isEditModalOpen && selectedBooking && (
        <EditBookingModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedBooking(null);
          }}
          booking={selectedBooking}
        />
      )}

      {isDeleteModalOpen && selectedBooking && (
        <DeleteBookingModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedBooking(null);
          }}
          booking={selectedBooking}
        />
      )}

      {isBirthdaySmsModalOpen && selectedBooking && (
        <BirthdaySmsModal
          isOpen={isBirthdaySmsModalOpen}
          onClose={() => {
            setIsBirthdaySmsModalOpen(false);
            setSelectedBooking(null);
          }}
          customerName={selectedBooking.customerName}
          phoneNumber={selectedBooking.phoneNumber}
        />
      )}
    </div>
  );
};

export default Bookings;

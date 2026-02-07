/**
 * useBookingsNew - Ultra Fast Bookings Hook
 * 
 * Shogirtlar kabi instant loading va optimallashtirilgan
 */

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

interface Booking {
  _id: string;
  customerName: string;
  phoneNumber: string;
  licensePlate: string;
  bookingDate: string;
  birthDate?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdBy: {
    _id: string;
    name: string;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
}

export function useBookingsNew() {
  // ⚡ INSTANT LOADING: Initial state'ni localStorage'dan olish (0ms)
  const [bookings, setBookings] = useState<Booking[]>(() => {
    try {
      const cached = localStorage.getItem('bookings_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        // Cache 5 daqiqa amal qiladi
        if (Date.now() - parsed.timestamp < 5 * 60 * 1000) {
          return parsed.data || [];
        }
      }
    } catch (err) {
      console.error('Failed to load bookings from localStorage:', err);
    }
    return [];
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load bookings - ULTRA OPTIMIZED
  const loadBookings = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      setError(null);
      
      // API'dan ma'lumot olish
      const response = await api.get('/bookings');
      const data = response.data.bookings || [];
      
      // State'ni yangilash
      setBookings(data);
      
      // ⚡ INSTANT: Save to localStorage
      try {
        localStorage.setItem('bookings_cache', JSON.stringify({
          data,
          timestamp: Date.now()
        }));
      } catch (err) {
        console.error('Failed to cache bookings:', err);
      }
    } catch (err: any) {
      console.error('Failed to load bookings:', err);
      setError(err.message);
      // Xatolik bo'lsa, cache'dan yuklash
      if (!silent) {
        try {
          const cached = localStorage.getItem('bookings_cache');
          if (cached) {
            const parsed = JSON.parse(cached);
            setBookings(parsed.data || []);
          }
        } catch (cacheErr) {
          console.error('Failed to load from cache:', cacheErr);
        }
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  // Initial load
  useEffect(() => {
    const hasCache = localStorage.getItem('bookings_cache');
    loadBookings(!!hasCache);
  }, [loadBookings]);

  // Refresh
  const refresh = useCallback(async () => {
    await loadBookings(true);
  }, [loadBookings]);

  // Create booking - OPTIMISTIC UPDATE
  const createBooking = useCallback(async (bookingData: any) => {
    try {
      // Get current user from localStorage
      const userStr = localStorage.getItem('user');
      const currentUser = userStr ? JSON.parse(userStr) : null;
      
      const tempBooking: Booking = {
        ...bookingData,
        _id: `temp_${Date.now()}_optimistic`,
        status: bookingData.status || 'pending',
        createdBy: currentUser || {
          _id: 'temp',
          name: 'Current User',
          username: 'user'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // ⚡ INSTANT: Darhol UI'ga qo'shish (0.01s)
      setBookings(prev => [tempBooking, ...prev]);
      
      // Background'da yaratish
      api.post('/bookings', bookingData).then((response) => {
        const newBooking = response.data.booking;
        
        // Temp'ni real ma'lumot bilan almashtirish
        setBookings(prev => prev.map(b => 
          b._id === tempBooking._id ? newBooking : b
        ));
        
        // Cache'ni yangilash
        try {
          const cached = localStorage.getItem('bookings_cache');
          if (cached) {
            const parsed = JSON.parse(cached);
            const updatedData = [newBooking, ...parsed.data.filter((b: any) => b._id !== tempBooking._id)];
            localStorage.setItem('bookings_cache', JSON.stringify({
              data: updatedData,
              timestamp: Date.now()
            }));
          }
        } catch (err) {
          console.error('Failed to update cache:', err);
        }
      }).catch(err => {
        console.error('Failed to create booking:', err);
        // Xatolik bo'lsa, temp'ni olib tashlash
        setBookings(prev => prev.filter(b => b._id !== tempBooking._id));
      });
      
      return tempBooking;
    } catch (err: any) {
      console.error('Failed to create booking:', err);
      throw err;
    }
  }, []);

  // Delete booking - OPTIMISTIC UPDATE
  const deleteBooking = useCallback(async (bookingId: string) => {
    try {
      const deletedBooking = bookings.find(b => b._id === bookingId);
      setBookings(prev => prev.filter(b => b._id !== bookingId));
      
      // Background'da o'chirish
      api.delete(`/bookings/${bookingId}`).then(() => {
        // Cache'ni yangilash
        try {
          const cached = localStorage.getItem('bookings_cache');
          if (cached) {
            const parsed = JSON.parse(cached);
            const updatedData = parsed.data.filter((b: any) => b._id !== bookingId);
            localStorage.setItem('bookings_cache', JSON.stringify({
              data: updatedData,
              timestamp: Date.now()
            }));
          }
        } catch (err) {
          console.error('Failed to update cache:', err);
        }
      }).catch(err => {
        console.error('Failed to delete booking:', err);
        // Xatolik bo'lsa, qaytarib qo'yish
        if (deletedBooking) {
          setBookings(prev => [deletedBooking, ...prev]);
        }
      });
      
      return true;
    } catch (err: any) {
      console.error('Failed to delete booking:', err);
      throw err;
    }
  }, [bookings]);

  // Update booking - OPTIMISTIC UPDATE
  const updateBooking = useCallback(async (bookingId: string, updateData: any) => {
    try {
      const oldBooking = bookings.find(b => b._id === bookingId);
      setBookings(prev => prev.map(b => 
        b._id === bookingId ? { ...b, ...updateData } : b
      ));
      
      // Background'da yangilash
      api.put(`/bookings/${bookingId}`, updateData).then((response) => {
        const updatedBooking = response.data.booking;
        
        // Real ma'lumot bilan yangilash
        setBookings(prev => prev.map(b => 
          b._id === bookingId ? updatedBooking : b
        ));
        
        // Cache'ni yangilash
        try {
          const cached = localStorage.getItem('bookings_cache');
          if (cached) {
            const parsed = JSON.parse(cached);
            const updatedData = parsed.data.map((b: any) => 
              b._id === bookingId ? updatedBooking : b
            );
            localStorage.setItem('bookings_cache', JSON.stringify({
              data: updatedData,
              timestamp: Date.now()
            }));
          }
        } catch (err) {
          console.error('Failed to update cache:', err);
        }
      }).catch(err => {
        console.error('Failed to update booking:', err);
        // Xatolik bo'lsa, eski ma'lumotga qaytarish
        if (oldBooking) {
          setBookings(prev => prev.map(b => 
            b._id === bookingId ? oldBooking : b
          ));
        }
      });
      
      return true;
    } catch (err: any) {
      console.error('Failed to update booking:', err);
      throw err;
    }
  }, [bookings]);

  return {
    bookings,
    loading,
    error,
    refresh,
    createBooking,
    deleteBooking,
    updateBooking
  };
}

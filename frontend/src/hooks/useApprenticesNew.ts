/**
 * useApprenticesNew - Ultra Fast Apprentices Hook
 * 
 * Avtomobillar kabi instant loading va optimallashtirilgan
 */

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { User } from '@/types';

export function useApprenticesNew() {
  // ⚡ INSTANT LOADING: Initial state'ni localStorage'dan olish (0ms)
  const [apprentices, setApprentices] = useState<User[]>(() => {
    try {
      const cached = localStorage.getItem('apprentices_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        // Cache 5 daqiqa amal qiladi
        if (Date.now() - parsed.timestamp < 5 * 60 * 1000) {
          return parsed.data || [];
        }
      }
    } catch (err) {
      console.error('Failed to load apprentices from localStorage:', err);
    }
    return [];
  });
  
  const [loading, setLoading] = useState(false); // Always false - instant loading
  const [error, setError] = useState<string | null>(null);

  // Load apprentices - ULTRA OPTIMIZED (instant loading, no spinner)
  const loadApprentices = useCallback(async (silent = false) => {
    try {
      // Agar cache bo'lmasa va silent emas bo'lsa - loading ko'rsatish
      const hasCache = localStorage.getItem('apprentices_cache');
      if (!silent && !hasCache) {
        setLoading(true);
      }
      setError(null);
      
      // API'dan ma'lumot olish
      const response = await api.get('/auth/apprentices/stats');
      const data = response.data.users || [];
      
      // State'ni yangilash
      setApprentices(data);
      
      // ⚡ INSTANT: Save to localStorage for next page load (0ms)
      try {
        localStorage.setItem('apprentices_cache', JSON.stringify({
          data,
          timestamp: Date.now()
        }));
      } catch (err) {
        console.error('Failed to cache apprentices to localStorage:', err);
      }
    } catch (err: any) {
      console.error('Failed to load apprentices:', err);
      setError(err.message);
      // Xatolik bo'lsa, cache'dan yuklash
      if (!silent) {
        try {
          const cached = localStorage.getItem('apprentices_cache');
          if (cached) {
            const parsed = JSON.parse(cached);
            setApprentices(parsed.data || []);
          }
        } catch (cacheErr) {
          console.error('Failed to load from cache:', cacheErr);
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    // Agar cache bo'lsa, silent yuklash (loading ko'rsatmaslik)
    // Agar cache bo'lmasa, loading ko'rsatish
    const hasCache = localStorage.getItem('apprentices_cache');
    loadApprentices(!!hasCache); // silent = true if cache exists
  }, [loadApprentices]);

  // Refresh
  const refresh = useCallback(async () => {
    await loadApprentices(true); // silent reload
  }, [loadApprentices]);

  // Create apprentice - OPTIMISTIC UPDATE (instant UI)
  const createApprentice = useCallback(async (apprenticeData: any) => {
    try {
      // OPTIMIZATION 1: INSTANT UI update with temp apprentice
      const tempApprentice = {
        ...apprenticeData,
        _id: `temp_${Date.now()}_optimistic`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalEarnings: 0,
        stats: {
          totalTasks: 0,
          completedTasks: 0,
          approvedTasks: 0,
          inProgressTasks: 0,
          assignedTasks: 0,
          rejectedTasks: 0,
          performance: 0,
          awards: 0
        }
      };
      
      // Darhol UI'ga qo'shish
      setApprentices(prev => [tempApprentice, ...prev]);
      
      // OPTIMIZATION 2: Fire and forget - background'da yaratish
      api.post('/auth/register', apprenticeData).then((response) => {
        const newApprentice = response.data.user;
        
        // Temp'ni real ma'lumot bilan almashtirish
        setApprentices(prev => prev.map(app => 
          app._id === tempApprentice._id ? {
            ...newApprentice,
            stats: {
              totalTasks: 0,
              completedTasks: 0,
              approvedTasks: 0,
              inProgressTasks: 0,
              assignedTasks: 0,
              rejectedTasks: 0,
              performance: 0,
              awards: 0
            }
          } : app
        ));
        
        // Cache'ni yangilash
        try {
          const cached = localStorage.getItem('apprentices_cache');
          if (cached) {
            const parsed = JSON.parse(cached);
            const updatedData = [
              {
                ...newApprentice,
                stats: {
                  totalTasks: 0,
                  completedTasks: 0,
                  approvedTasks: 0,
                  inProgressTasks: 0,
                  assignedTasks: 0,
                  rejectedTasks: 0,
                  performance: 0,
                  awards: 0
                }
              },
              ...parsed.data.filter((a: any) => a._id !== tempApprentice._id)
            ];
            localStorage.setItem('apprentices_cache', JSON.stringify({
              data: updatedData,
              timestamp: Date.now()
            }));
          }
        } catch (err) {
          console.error('Failed to update cache:', err);
        }
      }).catch(err => {
        console.error('Failed to create apprentice:', err);
        // Xatolik bo'lsa, temp'ni olib tashlash va xabar ko'rsatish
        setApprentices(prev => prev.filter(app => app._id !== tempApprentice._id));
        toast.error('❌ Xatolik: Shogird yaratilmadi');
      });
      
      return tempApprentice; // Darhol qaytarish
    } catch (err: any) {
      console.error('Failed to create apprentice:', err);
      toast.error('❌ Xatolik yuz berdi');
      throw err;
    }
  }, []);

  // Delete apprentice - OPTIMISTIC UPDATE (instant UI)
  const deleteApprentice = useCallback(async (apprenticeId: string) => {
    try {
      // OPTIMIZATION 1: INSTANT UI update - darhol o'chirish
      const deletedApprentice = apprentices.find(a => a._id === apprenticeId);
      setApprentices(prev => prev.filter(app => app._id !== apprenticeId));
      
      // OPTIMIZATION 2: Fire and forget - background'da o'chirish
      api.delete(`/auth/users/${apprenticeId}`).then(() => {
        // Cache'ni yangilash
        try {
          const cached = localStorage.getItem('apprentices_cache');
          if (cached) {
            const parsed = JSON.parse(cached);
            const updatedData = parsed.data.filter((a: any) => a._id !== apprenticeId);
            localStorage.setItem('apprentices_cache', JSON.stringify({
              data: updatedData,
              timestamp: Date.now()
            }));
          }
        } catch (err) {
          console.error('Failed to update cache:', err);
        }
      }).catch(err => {
        console.error('Failed to delete apprentice:', err);
        // Xatolik bo'lsa, qaytarib qo'yish va xabar ko'rsatish
        if (deletedApprentice) {
          setApprentices(prev => [deletedApprentice, ...prev]);
          toast.error('❌ Xatolik: Shogird o\'chirilmadi');
        }
      });
      
      return true; // Darhol qaytarish
    } catch (err: any) {
      console.error('Failed to delete apprentice:', err);
      toast.error('❌ Xatolik yuz berdi');
      throw err;
    }
  }, [apprentices]);

  // Update apprentice - OPTIMISTIC UPDATE (instant UI)
  const updateApprentice = useCallback(async (apprenticeId: string, updateData: any) => {
    try {
      // OPTIMIZATION 1: INSTANT UI update - darhol yangilash
      const oldApprentice = apprentices.find(a => a._id === apprenticeId);
      setApprentices(prev => prev.map(app => 
        app._id === apprenticeId ? { ...app, ...updateData } : app
      ));
      
      // OPTIMIZATION 2: Fire and forget - background'da yangilash
      api.patch(`/auth/users/${apprenticeId}`, updateData).then((response) => {
        const updatedApprentice = response.data.user;
        
        // Real ma'lumot bilan yangilash
        setApprentices(prev => prev.map(app => 
          app._id === apprenticeId ? { ...app, ...updatedApprentice } : app
        ));
        
        // Cache'ni yangilash
        try {
          const cached = localStorage.getItem('apprentices_cache');
          if (cached) {
            const parsed = JSON.parse(cached);
            const updatedData = parsed.data.map((a: any) => 
              a._id === apprenticeId ? { ...a, ...updatedApprentice } : a
            );
            localStorage.setItem('apprentices_cache', JSON.stringify({
              data: updatedData,
              timestamp: Date.now()
            }));
          }
        } catch (err) {
          console.error('Failed to update cache:', err);
        }
      }).catch(err => {
        console.error('Failed to update apprentice:', err);
        // Xatolik bo'lsa, eski ma'lumotga qaytarish va xabar ko'rsatish
        if (oldApprentice) {
          setApprentices(prev => prev.map(app => 
            app._id === apprenticeId ? oldApprentice : app
          ));
          toast.error('❌ Xatolik: Shogird yangilanmadi');
        }
      });
      
      return true; // Darhol qaytarish
    } catch (err: any) {
      console.error('Failed to update apprentice:', err);
      toast.error('❌ Xatolik yuz berdi');
      throw err;
    }
  }, [apprentices]);

  return {
    apprentices,
    loading,
    error,
    refresh,
    createApprentice,
    deleteApprentice,
    updateApprentice
  };
}

/**
 * useCarsNew - Simplified Cars Hook using Repository Pattern
 * 
 * Bu hook yangi repository pattern'dan foydalanadi
 * Eski useCarsHybrid'dan ancha sodda va tushunarli
 */

import { useState, useEffect, useCallback } from 'react';
import { carsRepository } from '@/lib/repositories/CarsRepository';
import { NetworkManager } from '@/lib/sync/NetworkManager';
import { QueueManager } from '@/lib/sync/QueueManager';
import { SyncManager } from '@/lib/sync/SyncManager';
import { Car } from '@/lib/types/base';
import toast from 'react-hot-toast';

export function useCarsNew() {
  // ⚡ INSTANT LOADING: Initial state'ni localStorage'dan olish (0ms)
  const [cars, setCars] = useState<Car[]>(() => {
    try {
      const cached = localStorage.getItem('cars_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        // Cache 24 soat amal qiladi
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          return parsed.data || [];
        }
      }
    } catch (err) {
      console.error('Failed to load cars from localStorage:', err);
    }
    return [];
  });
  const [loading] = useState(false); // Always false - instant loading
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const networkManager = NetworkManager.getInstance();
  const queueManager = QueueManager.getInstance();
  const syncManager = SyncManager.getInstance();

  // Load cars - ULTRA OPTIMIZED (instant loading, no spinner)
  const loadCars = useCallback(async (silent = false) => {
    try {
      // NEVER show loading - instant UI
      setError(null);
      
      // INSTANT: Load from cache immediately (0ms)
      const networkStatus = networkManager.getStatus();
      
      // FAST PATH: Always load from IndexedDB first (instant)
      const data = await carsRepository.getAll();
      setCars(data);
      
      // ⚡ INSTANT: Save to localStorage for next page load (0ms)
      try {
        localStorage.setItem('cars_cache', JSON.stringify({
          data,
          timestamp: Date.now()
        }));
      } catch (err) {
        console.error('Failed to cache cars to localStorage:', err);
      }
      
      // Background sync if online (user won't see this)
      if (networkStatus.isOnline && !silent) {
        // Fire and forget - update in background
        carsRepository.getAll().then(freshData => {
          // Only update if data changed
          if (JSON.stringify(freshData) !== JSON.stringify(data)) {
            setCars(freshData);
            // Update localStorage cache
            try {
              localStorage.setItem('cars_cache', JSON.stringify({
                data: freshData,
                timestamp: Date.now()
              }));
            } catch (err) {
              console.error('Failed to update cars cache:', err);
            }
          }
        }).catch(err => {
          console.error('Background refresh failed:', err);
        });
      }
    } catch (err: any) {
      console.error('Failed to load cars:', err);
      setError(err.message);
      setCars([]);
    }
  }, [networkManager]);

  // Update pending count
  const updatePendingCount = useCallback(async () => {
    try {
      const count = await queueManager.getPendingCount();
      setPendingCount(count);
    } catch (err) {
      console.error('Failed to get pending count:', err);
    }
  }, [queueManager]);

  // Network status listener - INSTANT REFRESH on network change (0.1s)
  useEffect(() => {
    let refreshTimeout: NodeJS.Timeout | null = null;
    
    const unsubscribe = networkManager.onStatusChange(async (status) => {
      const wasOffline = !isOnline;
      const wasOnline = isOnline;
      setIsOnline(status.isOnline);
      
      // Clear any pending refresh
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
      
      // OFFLINE → ONLINE: INSTANT refresh (100ms)
      if (status.isOnline && wasOffline) {
        // 1. Pending count'ni darhol yangilash
        updatePendingCount();
        
        // 2. 100ms kutib INSTANT refresh (0.1 soniya)
        refreshTimeout = setTimeout(async () => {
          await loadCars(true); // silent reload, no loading spinner
          updatePendingCount();
        }, 100); // 0.1 second - INSTANT!
        
        // 3. Sync avtomatik boshlanadi (SyncManager ichida)
        // 4. Sync tugagandan keyin yana refresh bo'ladi (syncManager.onSyncComplete orqali)
      }
      
      // ONLINE → OFFLINE: INSTANT refresh (100ms)
      if (!status.isOnline && wasOnline) {
        // 100ms kutib INSTANT refresh
        refreshTimeout = setTimeout(async () => {
          await loadCars(true); // silent reload, no loading spinner
          updatePendingCount();
        }, 100); // 0.1 second - INSTANT!
      }
    });

    return () => {
      unsubscribe();
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
    };
  }, [networkManager, isOnline, updatePendingCount, loadCars]);

  // Sync listener - listen to sync results
  useEffect(() => {
    const unsubscribe = syncManager.onSyncComplete((result) => {
      setIsSyncing(false);
      
      if (result.success > 0 || result.failed > 0) {
        // BACKGROUND'da reload (sezilmasin, loading ko'rsatmaslik)
        loadCars(true); // true = background refresh, no loading spinner
        updatePendingCount();
      }
    });

    return unsubscribe;
  }, [syncManager, loadCars, updatePendingCount]);

  // Initial load
  useEffect(() => {
    loadCars(); // Initial load with loading spinner
    updatePendingCount();
    
    // REMOVED: Page visibility change listener to prevent frequent refreshes
    // Sync will happen automatically when network status changes
  }, [loadCars, updatePendingCount]);

  // Create car - OPTIMIZED (instant UI update, silent)
  const createCar = useCallback(async (carData: Omit<Car, '_id'>) => {
    try {
      // OPTIMIZATION 1: INSTANT UI update with temp car
      const tempCar: Car = {
        ...carData,
        _id: `temp_${Date.now()}_optimistic`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _pending: !isOnline,
        parts: carData.parts || [],
        serviceItems: carData.serviceItems || [],
        totalEstimate: carData.totalEstimate || 0,
        paidAmount: carData.paidAmount || 0
      } as Car;
      
      setCars(prev => [tempCar, ...prev]);
      
      // OPTIMIZATION 2: Fire and forget for non-critical operations
      carsRepository.create(carData).then((newCar) => {
        // Replace temp with real car
        setCars(prev => prev.map(car => 
          car._id === tempCar._id ? newCar : car
        ));
        updatePendingCount();
      }).catch(err => {
        console.error('Failed to create car:', err);
        // Remove temp car on error
        setCars(prev => prev.filter(car => car._id !== tempCar._id));
        toast.error(`Xatolik: ${err.message}`);
      });
      
      return tempCar; // Return immediately for UI
    } catch (err: any) {
      console.error('Failed to create car:', err);
      toast.error(`Xatolik: ${err.message}`);
      
      // Rollback on error
      await loadCars();
      throw err;
    }
  }, [isOnline, updatePendingCount, loadCars]);

  // Update car - OPTIMIZED (instant UI update, silent)
  const updateCar = useCallback(async (id: string, carData: Partial<Car>) => {
    try {
      // OPTIMIZATION 1: INSTANT UI update
      setCars(prev => prev.map(car => 
        car._id === id ? { ...car, ...carData, _pending: !isOnline } : car
      ));
      
      // OPTIMIZATION 2: Fire and forget for non-critical operations
      carsRepository.update(id, carData).then((updatedCar) => {
        // Real data bilan yangilash
        setCars(prev => prev.map(car => car._id === id ? updatedCar : car));
        updatePendingCount();
      }).catch(err => {
        console.error('Failed to update car:', err);
        // Rollback on error
        loadCars(true); // silent reload
      });
      
      return carData as Car; // Return immediately for UI
    } catch (err: any) {
      console.error('Failed to update car:', err);
      toast.error(`Xatolik: ${err.message}`);
      
      // Rollback on error
      await loadCars();
      throw err;
    }
  }, [isOnline, updatePendingCount, loadCars]);

  // Delete car - OPTIMIZED (instant UI update, silent)
  const deleteCar = useCallback(async (id: string) => {
    try {
      // OPTIMIZATION 1: INSTANT UI update (no await)
      setCars(prev => prev.filter(car => car._id !== id));
      
      // OPTIMIZATION 2: Fire and forget for non-critical operations
      carsRepository.delete(id).then(() => {
        updatePendingCount();
      }).catch(err => {
        console.error('Failed to delete car:', err);
        // Rollback on error
        loadCars(true); // silent reload
      });
    } catch (err: any) {
      console.error('Failed to delete car:', err);
      toast.error(`Xatolik: ${err.message}`);
      
      // Rollback on error
      await loadCars();
      throw err;
    }
  }, [isOnline, updatePendingCount, loadCars]);

  // Refresh
  const refresh = useCallback(async () => {
    await loadCars();
    await updatePendingCount();
  }, [loadCars, updatePendingCount]);

  // Force sync now
  const syncNow = useCallback(async () => {
    if (!isOnline) {
      toast.error('❌ Offline - sync qilib bo\'lmaydi');
      return;
    }

    if (isSyncing) {
      toast.error('⏳ Sync jarayonda...');
      return;
    }

    try {
      setIsSyncing(true);
      toast.loading('🔄 Sync boshlanmoqda...', { id: 'sync' });
      
      const result = await syncManager.forceSyncNow();
      
      toast.dismiss('sync');
      
      if (result.success > 0) {
        toast.success(`✅ ${result.success} ta vazifa bajarildi`);
      } else if (result.failed > 0) {
        toast.error(`❌ ${result.failed} ta vazifa bajarilmadi`);
      } else {
        toast.success('✅ Barcha vazifalar bajarilgan');
      }
      
      await loadCars(true); // Background refresh
      await updatePendingCount();
    } catch (err: any) {
      console.error('Sync failed:', err);
      toast.error(`Xatolik: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, syncManager, loadCars, updatePendingCount]);

  return {
    cars,
    loading,
    error,
    isOnline,
    pendingCount,
    isSyncing,
    createCar,
    updateCar,
    deleteCar,
    refresh,
    syncNow
  };
}

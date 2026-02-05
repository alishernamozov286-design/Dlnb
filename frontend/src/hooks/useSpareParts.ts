import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import React from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { SparePartFilters, SparePartResponse, SparePart } from '@/types';

// Debounced search hook
export const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export const useSearchSpareParts = (query: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['spare-parts-search', query],
    queryFn: async (): Promise<{ spareParts: SparePart[] }> => {
      if (!query || query.length < 2) {
        return { spareParts: [] };
      }
      const response = await api.get(`/spare-parts/search?q=${encodeURIComponent(query)}&limit=10`);
      return response.data;
    },
    enabled: enabled && query.length >= 2,
    staleTime: 30000, // 30 seconds
    retry: 2,
  });
};

export const useSpareParts = (filters: SparePartFilters = {}) => {
  return useQuery({
    queryKey: ['spare-parts', filters],
    queryFn: async (): Promise<SparePartResponse> => {
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.lowStock) params.append('lowStock', 'true');
      
      const response = await api.get(`/spare-parts?${params.toString()}`);
      return response.data;
    },
    staleTime: 60000, // 1 minute
    retry: 2,
    placeholderData: (previousData) => previousData, // React Query v5 replacement for keepPreviousData
  });
};

// Infinite scroll hook for large datasets
export const useInfiniteSpareParts = (filters: Omit<SparePartFilters, 'page'> = {}) => {
  return useInfiniteQuery({
    queryKey: ['spare-parts-infinite', filters],
    queryFn: async ({ pageParam = 1 }): Promise<SparePartResponse> => {
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.lowStock) params.append('lowStock', 'true');
      params.append('page', (pageParam as number).toString());
      
      const response = await api.get(`/spare-parts?${params.toString()}`);
      return response.data;
    },
    getNextPageParam: (lastPage: SparePartResponse) => {
      const { page, pages } = lastPage.pagination;
      return page < pages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 60000,
    retry: 2,
  });
};

export const useClientParts = () => {
  return useQuery({
    queryKey: ['client-parts'],
    queryFn: async () => {
      const response = await api.get('/cars/client-parts');
      return response.data;
    },
    staleTime: 30000,
    retry: 2,
  });
};

export const useSparePartCategories = () => {
  return useQuery({
    queryKey: ['spare-part-categories'],
    queryFn: async () => {
      const response = await api.get('/spare-parts/categories');
      return response.data;
    },
    staleTime: 300000, // 5 minutes
    retry: 2,
  });
};

export const useCreateSparePart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (sparePartData: Partial<SparePart>) => {
      const response = await api.post('/spare-parts', sparePartData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spare-parts'] });
      queryClient.invalidateQueries({ queryKey: ['spare-parts-search'] });
      queryClient.invalidateQueries({ queryKey: ['spare-parts-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['spare-part-categories'] });
      toast.success('Zapchast muvaffaqiyatli yaratildi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Zapchast yaratishda xatolik yuz berdi');
    },
  });
};

export const useUpdateSparePart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SparePart> }) => {
      const response = await api.put(`/spare-parts/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spare-parts'] });
      queryClient.invalidateQueries({ queryKey: ['spare-parts-search'] });
      queryClient.invalidateQueries({ queryKey: ['spare-parts-infinite'] });
      toast.success('Zapchast muvaffaqiyatli yangilandi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Zapchastni yangilashda xatolik yuz berdi');
    },
  });
};

export const useDeleteSparePart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/spare-parts/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spare-parts'] });
      queryClient.invalidateQueries({ queryKey: ['spare-parts-search'] });
      queryClient.invalidateQueries({ queryKey: ['spare-parts-infinite'] });
      toast.success('Zapchast muvaffaqiyatli o\'chirildi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Zapchastni o\'chirishda xatolik yuz berdi');
    },
  });
};

export const useIncrementSparePartUsage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch(`/spare-parts/${id}/increment-usage`);
      return response.data;
    },
    onSuccess: () => {
      // Quietly update cache without showing toast
      queryClient.invalidateQueries({ queryKey: ['spare-parts'] });
      queryClient.invalidateQueries({ queryKey: ['spare-parts-infinite'] });
    },
    onError: () => {
      // Silent error handling for usage increment
    },
  });
};

export const useRemoveClientPart = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ carId, partId }: { carId: string; partId: string }) => {
      const response = await api.delete(`/cars/${carId}/parts/${partId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-parts'] });
      toast.success('Client qismi muvaffaqiyatli o\'chirildi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Client qismini o\'chirishda xatolik yuz berdi');
    },
  });
};

// Low stock count hook for notification badge
export const useLowStockCount = () => {
  return useQuery({
    queryKey: ['low-stock-count'],
    queryFn: async (): Promise<number> => {
      // Offline rejimda 0 qaytarish
      if (!navigator.onLine) {
        return 0;
      }
      
      try {
        const response = await api.get('/spare-parts?limit=1', {
          timeout: 10000 // 10 sekund timeout
        });
        const count = response.data.statistics?.lowStockCount || 0;
        return count;
      } catch (error: any) {
        // Timeout yoki network xatoliklarda 0 qaytarish
        if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || error.message?.includes('timeout')) {
          return 0;
        }
        console.error('Error fetching low stock count:', error);
        return 0;
      }
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every 60 seconds (kamroq tez-tez)
    retry: 1, // Faqat 1 marta retry
    refetchOnMount: false, // Mount'da avtomatik refetch qilmaslik
    refetchOnWindowFocus: false, // Focus'da avtomatik refetch qilmaslik
    enabled: navigator.onLine, // Faqat online bo'lganda ishlaydi
  });
};
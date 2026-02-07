import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export const useEarnings = (filters?: { 
  startDate?: string; 
  endDate?: string; 
  period?: 'today' | 'week' | 'month' | 'year' | 'all' 
}) => {
  return useQuery({
    queryKey: ['earnings', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.period && filters.period !== 'all') params.append('period', filters.period);
      
      const response = await api.get(`/stats/earnings?${params.toString()}`);
      return response.data;
    },
    staleTime: Infinity, // Infinite cache - maksimal tezlik
    gcTime: Infinity, // Infinite cache
    retry: 0, // No retry - instant loading
    refetchOnMount: false, // Mount bo'lganda yangilanmasin
    refetchOnWindowFocus: false, // Focus'da yangilanmasin
    refetchOnReconnect: false, // Reconnect'da yangilanmasin
    placeholderData: (previousData) => previousData, // Instant loading from cache
  });
};

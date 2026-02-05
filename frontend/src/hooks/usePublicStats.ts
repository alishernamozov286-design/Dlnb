import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface PublicStats {
  apprentices: number;
  tasks: number;
  cars: number;
  aiQuestions: number;
}

export const usePublicStats = () => {
  return useQuery<PublicStats>({
    queryKey: ['publicStats'],
    queryFn: async () => {
      const response = await api.get('/stats/public');
      return response.data.stats;
    },
    staleTime: 5 * 60 * 1000, // 5 daqiqa
    refetchOnWindowFocus: false
  });
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export const useUsers = (role?: string) => {
  return useQuery({
    queryKey: ['users', role],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (role) params.append('role', role);
      
      const response = await api.get(`/auth/users?${params.toString()}`);
      return response.data;
    },
  });
};

export const useApprentices = () => {
  return useQuery({
    queryKey: ['apprentices', 'stats'],
    queryFn: async () => {
      const response = await api.get('/auth/apprentices/stats');
      return response.data;
    },
  });
};

export const useCreateApprentice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userData: any) => {
      const response = await api.post('/auth/register', userData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apprentices'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Shogird muvaffaqiyatli yaratildi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Shogird yaratishda xatolik yuz berdi');
    },
  });
};
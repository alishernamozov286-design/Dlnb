import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export const useDebts = (filters?: { type?: string; status?: string }) => {
  return useQuery({
    queryKey: ['debts', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.status) params.append('status', filters.status);
      
      const response = await api.get(`/debts?${params.toString()}`);
      return response.data;
    },
  });
};

export const useDebt = (id: string) => {
  return useQuery({
    queryKey: ['debt', id],
    queryFn: async () => {
      const response = await api.get(`/debts/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useDebtSummary = () => {
  return useQuery({
    queryKey: ['debtSummary'],
    queryFn: async () => {
      const response = await api.get('/debts/summary');
      return response.data;
    },
  });
};

export const useCreateDebt = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (debtData: any) => {
      const response = await api.post('/debts', debtData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['debtSummary'] });
      toast.success('Debt record created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create debt record');
    },
  });
};

export const useAddPayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, amount, notes }: { id: string; amount: number; notes?: string }) => {
      const response = await api.post(`/debts/${id}/payments`, { amount, notes });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['debt'] });
      queryClient.invalidateQueries({ queryKey: ['debtSummary'] });
      toast.success('To\'lov muvaffaqiyatli qo\'shildi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'To\'lov qo\'shishda xatolik');
    },
  });
};

export const useUpdateDebt = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.put(`/debts/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['debt'] });
      queryClient.invalidateQueries({ queryKey: ['debtSummary'] });
      toast.success('Qarz muvaffaqiyatli yangilandi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Qarzni yangilashda xatolik');
    },
  });
};

export const useDeleteDebt = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/debts/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['debtSummary'] });
      toast.success('Qarz muvaffaqiyatli o\'chirildi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Qarzni o\'chirishda xatolik');
    },
  });
};

// Muddati 3 kun ichida yoki o'tgan qarzlar sonini olish (sidebar notification uchun)
// Faqat master uchun
export const useOverdueDebtsCount = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['overdue-debts-count'],
    queryFn: async (): Promise<number> => {
      // Offline rejimda 0 qaytarish
      if (!navigator.onLine) {
        return 0;
      }
      
      try {
        const response = await api.get('/debts/overdue/count', {
          timeout: 10000 // 10 sekund timeout
        });
        const count = response.data.count || 0;
        return count;
      } catch (error: any) {
        // Timeout yoki network xatoliklarda 0 qaytarish
        if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || error.message?.includes('timeout')) {
          return 0;
        }
        console.error('Error fetching debts count:', error);
        return 0;
      }
    },
    enabled: enabled && navigator.onLine, // Faqat enabled=true va online bo'lganda ishlaydi
    staleTime: 30000, // 30 seconds
    refetchInterval: enabled && navigator.onLine ? 120000 : false, // 2 daqiqada bir marta (kamroq tez-tez)
    retry: 1, // Faqat 1 marta retry
    refetchOnMount: false, // Mount'da avtomatik refetch qilmaslik
    refetchOnWindowFocus: false, // Focus'da avtomatik refetch qilmaslik
  });
};

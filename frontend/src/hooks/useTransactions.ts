import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { TransactionFilters, TransactionResponse, TransactionSummary, Transaction } from '@/types';

export const useTransactions = (filters: TransactionFilters = {}) => {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: async (): Promise<TransactionResponse> => {
      const params = new URLSearchParams();
      
      if (filters.type) params.append('type', filters.type);
      if (filters.category) params.append('category', filters.category);
      if (filters.categoryId) params.append('categoryId', filters.categoryId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      
      const response = await api.get(`/transactions?${params.toString()}`);
      return response.data;
    },
    staleTime: 30000, // 30 seconds
    retry: 2,
    placeholderData: (previousData) => previousData, // React Query v5 replacement
  });
};

export const useTransactionSummary = () => {
  return useQuery({
    queryKey: ['transactionSummary'],
    queryFn: async (): Promise<{ summary: TransactionSummary }> => {
      const response = await api.get('/transactions/summary');
      return response.data;
    },
    staleTime: 60000, // 1 minute
    retry: 2,
  });
};

export const useTransactionStats = (dateRange?: { startDate?: string; endDate?: string }) => {
  return useQuery({
    queryKey: ['transactionStats', dateRange],
    queryFn: async (): Promise<{ summary: TransactionSummary }> => {
      const params = new URLSearchParams();
      if (dateRange?.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange?.endDate) params.append('endDate', dateRange.endDate);
      
      const response = await api.get(`/transactions/stats?${params.toString()}`);
      return response.data;
    },
    staleTime: 60000,
    retry: 2,
    enabled: !!dateRange,
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (transactionData: Partial<Transaction>) => {
      const response = await api.post('/transactions', transactionData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactionSummary'] });
      queryClient.invalidateQueries({ queryKey: ['transactionStats'] });
      queryClient.invalidateQueries({ queryKey: ['apprentices'] }); // Shogirdlar ma'lumotini yangilash
      queryClient.invalidateQueries({ queryKey: ['users'] }); // Foydalanuvchilar ma'lumotini yangilash
      toast.success('Tranzaksiya muvaffaqiyatli qo\'shildi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Tranzaksiya qo\'shishda xatolik');
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/transactions/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactionSummary'] });
      queryClient.invalidateQueries({ queryKey: ['transactionStats'] });
      toast.success('Tranzaksiya muvaffaqiyatli o\'chirildi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Tranzaksiya o\'chirishda xatolik');
    },
  });
};

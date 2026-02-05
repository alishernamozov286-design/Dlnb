import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// Get all expense categories
export const useExpenseCategories = () => {
  return useQuery({
    queryKey: ['expenseCategories'],
    queryFn: async () => {
      const response = await api.get('/expense-categories');
      return response.data;
    }
  });
};

// Create expense category
export const useCreateExpenseCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (categoryData: {
      name: string;
      nameUz: string;
      description: string;
      icon?: string;
      color?: string;
    }) => {
      const response = await api.post('/expense-categories', categoryData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenseCategories'] });
    }
  });
};

// Update expense category
export const useUpdateExpenseCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...categoryData }: {
      id: string;
      name?: string;
      nameUz?: string;
      description?: string;
      icon?: string;
      color?: string;
    }) => {
      const response = await api.put(`/expense-categories/${id}`, categoryData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenseCategories'] });
    }
  });
};

// Delete expense category
export const useDeleteExpenseCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/expense-categories/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenseCategories'] });
    }
  });
};

// Initialize default categories
export const useInitializeDefaultCategories = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/expense-categories/initialize');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenseCategories'] });
    }
  });
};
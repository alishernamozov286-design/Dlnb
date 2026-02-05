import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

export const useTasks = (filters?: { status?: string; assignedTo?: string; car?: string }) => {
  // Agar car filter'i temp ID bo'lsa, so'rov yubormaslik
  const shouldFetch = !filters?.car || !filters.car.startsWith('temp_');
  
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.assignedTo) params.append('assignedTo', filters.assignedTo);
      if (filters?.car && !filters.car.startsWith('temp_')) {
        params.append('car', filters.car);
      }
      
      const response = await api.get(`/tasks?${params.toString()}`);
      return response.data;
    },
    enabled: shouldFetch,
  });
};

// Hook to fetch tasks for a specific car
export const useCarTasks = (carId: string) => {
  return useQuery({
    queryKey: ['car-tasks', carId],
    queryFn: async () => {
      const response = await api.get(`/tasks?car=${carId}`);
      return response.data;
    },
    enabled: !!carId && !carId.startsWith('temp_'), // Temp ID'lar uchun so'rov yubormaslik
  });
};

export const useTask = (id: string) => {
  return useQuery({
    queryKey: ['task', id],
    queryFn: async () => {
      const response = await api.get(`/tasks/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useTaskStats = () => {
  return useQuery({
    queryKey: ['taskStats'],
    queryFn: async () => {
      const response = await api.get('/tasks/stats');
      return response.data;
    },
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (taskData: any) => {
      const response = await api.post('/tasks', taskData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['taskStats'] });
      toast.success('Vazifa muvaffaqiyatli yaratildi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Vazifa yaratishda xatolik yuz berdi');
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.put(`/tasks/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task'] });
      queryClient.invalidateQueries({ queryKey: ['taskStats'] });
      toast.success('Vazifa muvaffaqiyatli yangilandi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Vazifani yangilashda xatolik yuz berdi');
    },
  });
};

export const useUpdateTaskStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status, notes, actualHours }: { id: string; status: string; notes?: string; actualHours?: number }) => {
      const response = await api.patch(`/tasks/${id}/status`, { status, notes, actualHours });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task'] });
      queryClient.invalidateQueries({ queryKey: ['taskStats'] });
      toast.success('Task updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update task');
    },
  });
};

export const useApproveTask = () => {
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();
  
  return useMutation({
    mutationFn: async ({ id, approved, rejectionReason }: { id: string; approved: boolean; rejectionReason?: string }) => {
      const response = await api.patch(`/tasks/${id}/approve`, { approved, rejectionReason });
      return response.data;
    },
    onSuccess: (data) => {
      // Task cache'larini yangilash
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task'] });
      queryClient.invalidateQueries({ queryKey: ['taskStats'] });
      
      // Mashina cache'larini ham yangilash (avtomatik tugatish uchun)
      queryClient.invalidateQueries({ queryKey: ['cars'] });
      queryClient.invalidateQueries({ queryKey: ['car'] });
      
      // Car services cache'larini yangilash
      queryClient.invalidateQueries({ queryKey: ['car-services'] });
      queryClient.invalidateQueries({ queryKey: ['car-service'] });
      
      // Qarz cache'larini yangilash (yangi qarzlar uchun)
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      
      // User ma'lumotlarini yangilash (earnings uchun)
      refreshUser();
      
      // Success message
      const message = data.task.status === 'approved' ? 'Vazifa tasdiqlandi' : 'Vazifa rad etildi';
      toast.success(message);
      
      // Agar mashina avtomatik tugatilgan bo'lsa, qo'shimcha xabar
      if (data.carCompleted && data.carData) {
        toast.success(`🚗 Mashina avtomatik tugatildi: ${data.carData.licensePlate}`, {
          duration: 4000,
          icon: '✅'
        });
      }
      
      // Force refresh after a short delay to ensure all data is updated
      setTimeout(() => {
        queryClient.invalidateQueries();
      }, 1000);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Vazifani tasdiqlashda xatolik');
    },
  });
};

export const useRestartTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch(`/tasks/${id}/restart`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task'] });
      queryClient.invalidateQueries({ queryKey: ['taskStats'] });
      toast.success('Vazifa qayta boshlandi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Vazifani qayta boshlashda xatolik');
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/tasks/${id}`);
      return response.data;
    },
    onSuccess: (_data, id) => {
      // Cache dan o'chirilgan vazifani olib tashlash
      queryClient.setQueryData(['tasks'], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          tasks: oldData.tasks?.filter((task: any) => task._id !== id) || []
        };
      });
      
      // Barcha cache'larni yangilash
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['taskStats'] });
      queryClient.invalidateQueries({ queryKey: ['cars'] });
      queryClient.invalidateQueries({ queryKey: ['car-services'] });
      
      toast.success('Vazifa muvaffaqiyatli o\'chirildi');
    },
    onError: (error: any) => {
      // 404 xatosi - vazifa allaqachon o'chirilgan
      if (error.response?.status === 404) {
        toast.error('Vazifa allaqachon o\'chirilgan');
        // Cache ni yangilash
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      } else {
        toast.error(error.response?.data?.message || 'Vazifani o\'chirishda xatolik yuz berdi');
      }
    },
  });
};

// Completed tasks count hook for notification badge
export const useCompletedTasksCount = () => {
  return useQuery({
    queryKey: ['completed-tasks-count'],
    queryFn: async (): Promise<number> => {
      // Offline rejimda 0 qaytarish
      if (!navigator.onLine) {
        return 0;
      }
      
      try {
        const response = await api.get('/tasks?status=completed', {
          timeout: 10000 // 10 sekund timeout
        });
        return response.data.tasks?.length || 0;
      } catch (error: any) {
        // Timeout yoki network xatoliklarda 0 qaytarish
        if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || error.message?.includes('timeout')) {
          return 0;
        }
        console.error('Error fetching completed tasks count:', error);
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
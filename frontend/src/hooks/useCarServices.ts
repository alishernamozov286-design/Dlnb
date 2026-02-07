import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export const useCarServices = (filters?: { carId?: string; status?: string }) => {
  return useQuery({
    queryKey: ['car-services', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.carId) params.append('carId', filters.carId);
      if (filters?.status) params.append('status', filters.status);
      
      const response = await api.get(`/car-services?${params.toString()}`);
      return response.data;
    },
    staleTime: Infinity, // Hech qachon eski bo'lmaydi - instant loading
    gcTime: Infinity, // Hech qachon o'chirilmaydi
    retry: 0, // Qayta urinmaslik
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    notifyOnChangeProps: ['data'], // Faqat data o'zgarganda
    placeholderData: (previousData) => previousData, // Cache'dan instant yuklash
  });
};

export const useCarService = (id: string) => {
  return useQuery({
    queryKey: ['car-service', id],
    queryFn: async () => {
      const response = await api.get(`/car-services/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateCarService = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (serviceData: any) => {
      const response = await api.post('/car-services', serviceData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['car-services'] });
      queryClient.invalidateQueries({ queryKey: ['cars'] });
      toast.success('Xizmat muvaffaqiyatli yaratildi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Xizmat yaratishda xatolik');
    },
  });
};

export const useUpdateCarService = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.put(`/car-services/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['car-services'] });
      queryClient.invalidateQueries({ queryKey: ['car-service'] });
      queryClient.invalidateQueries({ queryKey: ['cars'] });
      toast.success('Xizmat muvaffaqiyatli yangilandi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Xizmatni yangilashda xatolik');
    },
  });
};

export const useUpdateServiceStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await api.patch(`/car-services/${id}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['car-services'] });
      queryClient.invalidateQueries({ queryKey: ['car-service'] });
      queryClient.invalidateQueries({ queryKey: ['cars'] });
      toast.success('Xizmat holati yangilandi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Xizmat holatini yangilashda xatolik');
    },
  });
};

export const useApproveService = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, approved, rejectionReason }: { id: string; approved: boolean; rejectionReason?: string }) => {
      const endpoint = approved ? `/car-services/${id}/approve` : `/car-services/${id}/reject`;
      const data = approved ? {} : { rejectionReason };
      const response = await api.patch(endpoint, data);
      return response.data;
    },
    onSuccess: (data) => {
      // Car services cache'larini yangilash
      queryClient.invalidateQueries({ queryKey: ['car-services'] });
      queryClient.invalidateQueries({ queryKey: ['car-service'] });
      
      // Mashina cache'larini ham yangilash (avtomatik tugatish uchun)
      queryClient.invalidateQueries({ queryKey: ['cars'] });
      queryClient.invalidateQueries({ queryKey: ['car'] });
      
      // Task cache'larini yangilash
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      
      // Qarz cache'larini yangilash (yangi qarzlar uchun)
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      
      // Success message
      const message = data.service.status === 'completed' ? 'Xizmat tasdiqlandi' : 'Xizmat rad etildi';
      toast.success(message);
      
      // Agar mashina avtomatik tugatilgan bo'lsa, qo'shimcha xabar
      if (data.carCompleted && data.carData) {
        toast.success(`🚗 Mashina avtomatik tugatildi: ${data.carData.licensePlate}`, {
          duration: 4000,
          icon: '✅'
        });
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Xizmatni tasdiqlashda xatolik');
    },
  });
};

export const useDeleteCarService = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/car-services/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['car-services'] });
      queryClient.invalidateQueries({ queryKey: ['cars'] });
      toast.success('Xizmat o\'chirildi');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Xizmatni o\'chirishda xatolik');
    },
  });
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { servicesRepository } from '@/lib/repositories/ServicesRepository';
import { NetworkManager } from '@/lib/sync/NetworkManager';
import { useState, useEffect, useCallback } from 'react';

export interface Service {
  _id: string;
  name: string;
  description: string;
  image?: string;
  imageUrl?: string;
  isActive?: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  price?: number;
  category?: string;
}

export const useServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const networkManager = NetworkManager.getInstance();

  const loadServices = useCallback(async () => {
    try {
      const networkStatus = networkManager.getStatus();
      setIsOnline(networkStatus.isOnline);

      // Instant loading - IndexedDB dan darhol yuklash
      const offlineServices = await servicesRepository.getAll();
      setServices(offlineServices as any);

      if (networkStatus.isOnline) {
        // Background'da API dan yangilash
        try {
          const response = await api.get('/services');
          const fetchedServices: Service[] = response.data.services || [];
          
          // IndexedDB ga saqlash (offline uchun)
          for (const service of fetchedServices) {
            await servicesRepository['storage'].save('carServices', [service as any]);
          }
          
          setServices(fetchedServices);
        } catch (error) {
          console.error('Online xizmatlarni yuklashda xatolik:', error);
        }
      }
    } catch (error) {
      console.error('Xizmatlarni yuklashda xatolik:', error);
      setServices([]);
    }
  }, [networkManager]);

  useEffect(() => {
    loadServices();

    // Network status o'zgarganda qayta yuklash
    const unsubscribe = networkManager.onStatusChange((status) => {
      setIsOnline(status.isOnline);
      if (status.isOnline) {
        loadServices();
      }
    });

    return unsubscribe;
  }, [loadServices, networkManager]);

  return {
    data: { services },
    isLoading: false, // Always false - instant loading
    isOnline,
    refetch: loadServices
  };
};

export const usePublicServices = () => {
  return useQuery({
    queryKey: ['services', 'public'],
    queryFn: async () => {
      const response = await api.get('/services/public');
      return response.data;
    },
  });
};

export const useCreateService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.post('/services', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['services', 'public'] });
    },
  });
};

export const useUpdateService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const response = await api.put(`/services/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['services', 'public'] });
    },
  });
};

export const useDeleteService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/services/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['services', 'public'] });
    },
  });
};

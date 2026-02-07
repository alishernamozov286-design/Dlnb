import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { usersRepository } from '@/lib/repositories/UsersRepository';
import { NetworkManager } from '@/lib/sync/NetworkManager';
import { useState, useEffect, useCallback } from 'react';

export const useUsers = (role?: string) => {
  const [users, setUsers] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const networkManager = NetworkManager.getInstance();

  const loadUsers = useCallback(async () => {
    try {
      const networkStatus = networkManager.getStatus();
      setIsOnline(networkStatus.isOnline);

      // Instant loading - IndexedDB dan darhol yuklash
      const offlineUsers = await usersRepository.getAll();
      setUsers(role ? offlineUsers.filter(u => u.role === role) : offlineUsers);

      if (networkStatus.isOnline) {
        // Background'da API dan yangilash
        try {
          const params = new URLSearchParams();
          if (role) params.append('role', role);
          
          const response = await api.get(`/auth/users?${params.toString()}`);
          const fetchedUsers = response.data.users || [];
          
          // IndexedDB ga saqlash (offline uchun)
          for (const user of fetchedUsers) {
            await usersRepository['storage'].save('users', [user]);
          }
          
          setUsers(fetchedUsers);
        } catch (error) {
          console.error('Online userlarni yuklashda xatolik:', error);
        }
      }
    } catch (error) {
      console.error('Userlarni yuklashda xatolik:', error);
      setUsers([]);
    }
  }, [role, networkManager]);

  useEffect(() => {
    loadUsers();

    // Network status o'zgarganda qayta yuklash
    const unsubscribe = networkManager.onStatusChange((status) => {
      setIsOnline(status.isOnline);
      if (status.isOnline) {
        loadUsers();
      }
    });

    return unsubscribe;
  }, [loadUsers, networkManager]);

  return {
    data: { users },
    isLoading: false, // Always false - instant loading
    isOnline,
    refetch: loadUsers
  };
};

export const useApprentices = () => {
  return useQuery({
    queryKey: ['apprentices', 'stats'],
    queryFn: async () => {
      const response = await api.get('/auth/apprentices/stats');
      return response.data;
    },
    staleTime: 60000, // 1 daqiqa - ma'lumotlar 1 daqiqa yangi hisoblanadi
    gcTime: 300000, // 5 daqiqa cache'da saqlanadi
    refetchOnWindowFocus: false, // Window focus'da qayta yuklamaslik
    refetchOnMount: false, // Mount'da qayta yuklamaslik (agar cache bor bo'lsa)
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
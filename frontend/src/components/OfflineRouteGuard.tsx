import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useBackendStatus } from '@/hooks/useBackendStatus';
import { useAuth } from '@/contexts/AuthContext';
import { NetworkManager } from '@/lib/sync/NetworkManager';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';

interface OfflineRouteGuardProps {
  children: React.ReactNode;
}

const OfflineRouteGuard: React.FC<OfflineRouteGuardProps> = ({ children }) => {
  const { isOnline, isLoading } = useBackendStatus();
  const { user } = useAuth();
  const location = useLocation();

  // Online ga qaytganda avtomatik sync (sezilmasin)
  useEffect(() => {
    const networkManager = NetworkManager.getInstance();
    
    let hasBeenOffline = false;

    const handleConnectionChange = async (status: any) => {
      const online = status.isOnline;
      
      if (!online) {
        hasBeenOffline = true;
        // Faqat offline bo'lganda xabar
        toast.error('Internet aloqasi uzildi. Faqat avtomobillar sahifasi ishlaydi.', {
          duration: 4000,
          icon: '📱'
        });
      } else if (hasBeenOffline) {
        // Online bo'lganda HECH QANDAY xabar ko'rsatmaslik
        // Sync avtomatik boshlanadi (SyncManager ichida)
        // UI avtomatik yangilanadi (useCarsNew ichida)
        
        hasBeenOffline = false;
      }
    };

    // NetworkManager bilan bog'lanish
    const unsubscribe = networkManager.onStatusChange(handleConnectionChange);

    return () => {
      unsubscribe();
    };
  }, []);

  // Loading holatida spinner ko'rsatish
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Online bo'lsa, hamma sahifalar ishlaydi
  if (isOnline) {
    return <>{children}</>;
  }

  // Offline bo'lsa, faqat avtomobillar sahifasiga ruxsat berish
  const allowedOfflinePaths = [
    '/app/cars',
    '/login'
  ];

  const isAllowedPath = allowedOfflinePaths.some(path => 
    location.pathname === path || location.pathname.startsWith(path)
  );

  // Agar ruxsat berilgan sahifa bo'lsa, ko'rsatish
  if (isAllowedPath) {
    return <>{children}</>;
  }

  // Offline holatda ruxsat berilmagan sahifaga kirishga harakat qilsa,
  // avtomobillar sahifasiga yo'naltirish
  if (user) {
    return <Navigate to="/app/cars" replace />;
  }

  // Login sahifasiga yo'naltirish
  return <Navigate to="/login" replace />;
};

export default OfflineRouteGuard;

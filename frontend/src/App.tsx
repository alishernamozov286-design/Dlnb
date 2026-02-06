import { Routes, Route, Navigate, BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import ApprenticeDashboard from '@/pages/apprentice/Dashboard';
import Tasks from '@/pages/Tasks';
import Cars from '@/pages/Cars';
import Debts from '@/pages/Debts';
import LoadingSpinner from '@/components/LoadingSpinner';
import AIChatWidget from '@/components/AIChatWidget';
import OfflineRouteGuard from '@/components/OfflineRouteGuard';
import OfflineTransitionModal from '@/components/OfflineTransitionModal';
import InstallPWA from '@/components/InstallPWA';
import React from 'react';

// Master pages
import MasterTasks from '@/pages/master/Tasks';
import MasterApprentices from '@/pages/master/Apprentices';
import MasterKnowledgeBase from '@/pages/master/KnowledgeBase';
import MasterCashier from '@/pages/master/Cashier';
import MasterExpenses from '@/pages/master/Expenses';
import MasterBookings from '@/pages/master/Bookings';
import MasterWarehouse from '@/pages/master/Warehouse';

// Apprentice pages
import ApprenticeTasks from '@/pages/apprentice/Tasks';
import ApprenticeAchievements from '@/pages/apprentice/Achievements';

// Create a client with improved error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error: any) => {
        // ERR_NETWORK_CHANGED uchun 2 marta retry
        if (error?.code === 'ERR_NETWORK_CHANGED' || 
            error?.message?.includes('network change') ||
            error?.message?.includes('ERR_NETWORK_CHANGED')) {2
          return failureCount < 2;
        }
        // Network xatolari uchun 1 marta retry
        if (error?.code === 'ERR_NETWORK' || 
            error?.code === 'ECONNABORTED' ||
            error?.message?.includes('timeout')) {
          return failureCount < 1;
        }
        // Boshqa xatolar uchun retry qilmaslik
        return false;
      },
      retryDelay: (attemptIndex) => {
        // Har bir retry orasida 500ms kutish (tezroq)
        return Math.min(500 * (attemptIndex + 1), 2000);
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true, // Network qayta ulanganida refetch qilish
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // ERR_NETWORK_CHANGED uchun 1 marta retry
        if (error?.code === 'ERR_NETWORK_CHANGED' || 
            error?.message?.includes('network change')) {
          return failureCount < 1;
        }
        // Boshqa xatolar uchun retry qilmaslik
        return false;
      },
      retryDelay: 500, // 500ms kutish (tezroq)
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function MasterRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'master') {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <>{children}</>;
}

function ApprenticeRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'apprentice') {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (user) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <>{children}</>;
}

function LandingRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Root URL'da login sahifasiga yo'naltirish
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to="/app/dashboard" replace />;
}

function DashboardRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Agar master bo'lsa, to'g'ridan-to'g'ri kassa sahifasiga yo'naltirish
  if (user.role === 'master') {
    return <Navigate to="/app/master/cashier" replace />;
  }

  // Agar apprentice bo'lsa, dashboard ko'rsatish
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <OfflineRouteGuard>
            <LandingRoute />
          </OfflineRouteGuard>
        }
      />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <OfflineRouteGuard>
              <Layout />
            </OfflineRouteGuard>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={
          <DashboardRoute>
            <ApprenticeDashboard />
          </DashboardRoute>
        } />
        
        {/* Master routes */}
        <Route path="master/cashier" element={
          <MasterRoute>
            <MasterCashier />
          </MasterRoute>
        } />
        <Route path="master/expenses" element={
          <MasterRoute>
            <MasterExpenses />
          </MasterRoute>
        } />
        <Route path="master/bookings" element={
          <MasterRoute>
            <MasterBookings />
          </MasterRoute>
        } />
        <Route path="master/tasks" element={
          <MasterRoute>
            <MasterTasks />
          </MasterRoute>
        } />
        <Route path="master/apprentices" element={
          <MasterRoute>
            <MasterApprentices />
          </MasterRoute>
        } />
        <Route path="master/knowledge" element={
          <MasterRoute>
            <MasterKnowledgeBase />
          </MasterRoute>
        } />
        <Route path="cars" element={
          <MasterRoute>
            <Cars />
          </MasterRoute>
        } />
        <Route path="debts" element={
          <MasterRoute>
            <Debts />
          </MasterRoute>
        } />
        
        {/* Apprentice routes */}
        <Route path="apprentice/tasks" element={
          <ApprenticeRoute>
            <ApprenticeTasks />
          </ApprenticeRoute>
        } />
        <Route path="apprentice/achievements" element={
          <ApprenticeRoute>
            <ApprenticeAchievements />
          </ApprenticeRoute>
        } />
        
        {/* Fallback tasks route - redirects based on role */}
        <Route path="tasks" element={<Tasks />} />
      </Route>
      
      {/* Warehouse route - without Layout/Sidebar */}
      <Route
        path="/app/master/warehouse"
        element={
          <OfflineRouteGuard>
            <ProtectedRoute>
              <MasterRoute>
                <MasterWarehouse />
              </MasterRoute>
            </ProtectedRoute>
          </OfflineRouteGuard>
        }
      />
    </Routes>
  );
}

function App() {
  // Userlarni offline uchun sync qilish
  React.useEffect(() => {
    const syncUsers = async () => {
      try {
        const { usersRepository } = await import('@/lib/repositories/UsersRepository');
        // getAll() orqali userlarni olish va saqlash
        await usersRepository.getAll();
        console.log('✅ Userlar offline uchun saqlandi');
      } catch (error) {
        console.error('❌ Userlarni sync qilishda xatolik:', error);
      }
    };

    // Ilova ochilganda sync qilish
    syncUsers();

    // Har 5 daqiqada sync qilish (online bo'lsa)
    const interval = setInterval(syncUsers, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <AIChatWidget />
          <OfflineTransitionModal />
          <InstallPWA />
        </AuthProvider>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
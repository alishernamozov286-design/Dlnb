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
// import PWAInstallPrompt from '@/components/PWAInstallPrompt';

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

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
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
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <AIChatWidget />
          {/* <PWAInstallPrompt /> */}
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
import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Car, 
  CreditCard, 
  LogOut,
  User,
  Users,
  Award,
  Globe,
  BookOpen,
  Menu,
} from 'lucide-react';
import { t } from '@/lib/transliteration';
import Sidebar from './Sidebar';
import { OfflineIndicator } from './OfflineIndicator';
import { SyncStatusNotification } from './SyncStatusNotification';
import { useLowStockCount } from '@/hooks/useSpareParts';
import { useCompletedTasksCount } from '@/hooks/useTasks';
import { useOverdueDebtsCount } from '@/hooks/useDebts';
import { useBackendStatus } from '@/hooks/useBackendStatus';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Fetch counts for master users
  const isMaster = user?.role === 'master';
  const isOnline = navigator.onLine;
  const { isOnline: backendOnline } = useBackendStatus();
  
  // Faqat online bo'lganda va master bo'lganda count hooklar ishlatiladi
  const { data: lowStockCount = 0 } = useLowStockCount();
  const { data: completedTasksCount = 0 } = useCompletedTasksCount();
  const { data: overdueDebtsCount = 0 } = useOverdueDebtsCount(isMaster && isOnline);

  // localStorage'dan tilni o'qish va o'zgartirish
  const [language, setLanguage] = useState<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  });

  // Tilni almashtirish funksiyasi
  const toggleLanguage = () => {
    const newLanguage = language === 'latin' ? 'cyrillic' : 'latin';
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
    window.location.reload();
  };

  // Screen size detection
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Rol asosida navigatsiya menyusini aniqlash
  const getMasterNavigation = () => {
    // Offline bo'lsa faqat avtomobillar sahifasi
    if (!backendOnline) {
      return [
        { name: t('Avtomobillar', language), href: '/app/cars', icon: Car },
      ];
    }
    
    // Online bo'lsa barcha sahifalar
    return [
      { name: t('Kassa', language), href: '/app/master/cashier', icon: CreditCard },
      { name: t('Xarajatlar', language), href: '/app/master/expenses', icon: BookOpen },
      { name: t('Mijozlar', language), href: '/app/master/bookings', icon: Users },
      { name: t('Avtomobillar', language), href: '/app/cars', icon: Car },
      { name: t('Shogirdlar', language), href: '/app/master/apprentices', icon: Users },
      { name: t('Qarz daftarchasi', language), href: '/app/debts', icon: BookOpen },
    ];
  };

  const getApprenticeNavigation = () => {
    // Offline bo'lsa faqat avtomobillar sahifasi
    if (!backendOnline) {
      return [
        { name: t('Avtomobillar', language), href: '/app/cars', icon: Car },
      ];
    }
    
    // Online bo'lsa barcha sahifalar
    return [
      { name: t('Shogird paneli', language), href: '/app/dashboard', icon: LayoutDashboard },
      { name: t('Mening vazifalarim', language), href: '/app/apprentice/tasks', icon: CheckSquare },
      { name: t('Mening daromadim', language), href: '/app/apprentice/achievements', icon: Award },
    ];
  };

  const navigation = user?.role === 'master' ? getMasterNavigation() : getApprenticeNavigation();

  const isActive = (path: string) => {
    // Aniq path matching
    return location.pathname === path;
  };

  // Warehouse sahifasida sidebar ko'rinmasligi kerak
  const isWarehousePage = location.pathname === '/app/master/warehouse';

  const getRoleGradient = () => {
    return user?.role === 'master' 
      ? 'from-blue-600 to-indigo-600' 
      : 'from-blue-600 to-indigo-600';
  };

  const getActiveGradient = () => {
    return user?.role === 'master'
      ? 'from-blue-500 to-indigo-600'
      : 'from-blue-500 to-indigo-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Offline Indicator */}
      <OfflineIndicator />
      
      {/* Sync Status Notification */}
      <SyncStatusNotification />
      
      {/* Mobile Header */}
      {isMobile && !isWarehousePage && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-white/95 backdrop-blur-lg shadow-lg border-b border-gray-200/50">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Menu Button */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="relative p-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg hover:scale-105 transition-all duration-200 group"
            >
              <Menu className="h-5 w-5" />
              {/* Notification Indicator - agar biror ogohlantirish bo'lsa */}
              {((user?.role === 'master' && (lowStockCount > 0 || completedTasksCount > 0 || overdueDebtsCount > 0)) || 
                (user?.role === 'apprentice' && lowStockCount > 0)) && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full animate-pulse shadow-lg border-2 border-white"></div>
              )}
            </button>

            {/* Site Name */}
            <div className="flex items-center gap-2">
              <div>
                <span className="block text-base font-bold text-gray-900">Dalnoboy Shop</span>
                <span className="block text-[9px] text-gray-600 font-medium -mt-0.5">Professional Service</span>
              </div>
            </div>

            {/* Language Toggle & Logout Buttons */}
            <div className="flex items-center space-x-2">
              {/* Language Toggle Button */}
              <button
                onClick={toggleLanguage}
                className="p-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg hover:scale-105 transition-all duration-200 group"
                title={language === 'latin' ? 'Кирил' : 'Lotin'}
              >
                <Globe className="h-5 w-5 group-hover:rotate-12 transition-transform duration-200" />
              </button>

              {/* Logout Button */}
              <button
                onClick={logout}
                className="p-2.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg hover:scale-105 transition-all duration-200 group"
                title={t("Chiqish", language)}
              >
                <LogOut className="h-5 w-5 group-hover:translate-x-0.5 transition-transform duration-200" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar - Mobile */}
      {!isWarehousePage && <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />}

      {/* Sidebar - faqat desktop uchun */}
      {!isMobile && !isWarehousePage && (
        <div 
          className="fixed inset-y-0 left-0 z-50 bg-white shadow-2xl w-72"
        >
          <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="relative flex h-24 items-center px-4 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-indigo-600">
            <div className="absolute inset-0 bg-black opacity-5"></div>
            <div className="relative z-10 flex items-center gap-3 flex-1">
              <div className="animate-fadeIn flex items-center gap-3">
                <div>
                  <span className="block text-xl font-bold text-white drop-shadow-lg">
                    Dalnoboy Shop
                  </span>
                  <span className="block text-[10px] text-white/80 font-medium">Professional Service</span>
                </div>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="border-b border-gray-100 p-4 animate-fadeIn">
              <div className="flex items-center">
                <div className={`relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${getRoleGradient()} shadow-lg flex-shrink-0`}>
                  <div className="absolute inset-0 bg-white opacity-10 rounded-xl"></div>
                  {user?.role === 'master' ? (
                    <Users className="h-6 w-6 text-white relative z-10" />
                  ) : (
                    <User className="h-6 w-6 text-white relative z-10" />
                  )}
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-white"></div>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                  <p className={`text-xs font-semibold ${user?.role === 'master' ? 'text-blue-600' : 'text-blue-600'}`}>
                    {user?.role === 'master' ? t('Ustoz', language) : t('Shogird', language)}
                  </p>
                </div>
              </div>
            </div>
          
          {/* Navigation */}
          <nav className="flex-1 space-y-1.5 p-3 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style>{`
              nav::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              const isSparePartsPage = item.href === '/app/master/spare-parts';
              const isTasksPage = item.href === '/app/master/tasks';
              const isDebtsPage = item.href === '/app/debts';
              const showSparePartsBadge = isSparePartsPage && lowStockCount > 0; // Shogirt uchun ham ko'rsatish
              const showTasksBadge = user?.role === 'master' && isTasksPage && completedTasksCount > 0;
              const showDebtsBadge = user?.role === 'master' && isDebtsPage && overdueDebtsCount > 0;
              
              return (
                <div key={item.name} className="relative group/item">
                  <Link
                    to={item.href}
                    className={`relative flex items-center rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 ${
                      active
                        ? `bg-gradient-to-r ${getActiveGradient()} text-white shadow-lg transform scale-[1.02]`
                        : 'text-gray-700 hover:bg-gray-50 hover:scale-[1.01]'
                    }`}
                  >
                    {active && (
                      <div className="absolute inset-0 bg-white opacity-10 rounded-xl"></div>
                    )}
                    <Icon
                      className={`h-5 w-5 flex-shrink-0 relative z-10 ${
                        active
                          ? 'text-white'
                          : 'text-gray-400 group-hover/item:text-gray-600'
                      } mr-3`}
                    />
                    <span className="relative z-10 truncate animate-fadeIn">{item.name}</span>
                    {showSparePartsBadge && (
                      <div className="ml-auto relative z-10 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold animate-pulse">
                        {lowStockCount}
                      </div>
                    )}
                    {showTasksBadge && (
                      <div className="ml-auto relative z-10 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-green-500 text-white text-xs font-bold animate-pulse">
                        {completedTasksCount}
                      </div>
                    )}
                    {showDebtsBadge && (
                      <div className="ml-auto relative z-10 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-600 text-white text-xs font-bold animate-pulse shadow-lg">
                        {overdueDebtsCount}
                      </div>
                    )}
                    {active && !showSparePartsBadge && !showTasksBadge && !showDebtsBadge && (
                      <div className="ml-auto relative z-10 animate-fadeIn">
                        <div className="h-2 w-2 rounded-full bg-white animate-pulse"></div>
                      </div>
                    )}
                  </Link>
                </div>
              );
            })}
          </nav>

          {/* Language Toggle & Logout */}
          <div className="border-t border-gray-100 p-3 space-y-1.5">
            {/* Til almashtirish tugmasi */}
            <div className="relative group/language">
              <button
                onClick={toggleLanguage}
                className="group/btn flex w-full items-center rounded-xl px-3 py-3 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 hover:scale-[1.01]"
              >
                <Globe className="h-5 w-5 text-gray-400 group-hover/btn:text-blue-500 flex-shrink-0 mr-3" />
                <span className="animate-fadeIn">
                  {language === 'latin' ? 'Кирил' : 'Lotin'}
                </span>
              </button>
            </div>

            {/* Chiqish tugmasi */}
            <div className="relative group/logout">
              <button
                onClick={logout}
                className="group/btn flex w-full items-center rounded-xl px-3 py-3 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-red-50 hover:text-red-600 hover:scale-[1.01]"
              >
                <LogOut className="h-5 w-5 text-gray-400 group-hover/btn:text-red-500 flex-shrink-0 mr-3" />
                <span className="animate-fadeIn">{t("Chiqish", language)}</span>
              </button>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={`transition-all duration-300 ${isMobile ? 'pl-0' : (isWarehousePage ? 'pl-0' : 'pl-72')}`}>
        <main className={`${isMobile ? 'pt-20 pb-8' : (isWarehousePage ? 'py-0' : 'py-8')}`}>
          <div className={`mx-auto ${isWarehousePage ? 'max-w-full px-0' : 'max-w-7xl px-4 sm:px-6 lg:px-8'}`}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
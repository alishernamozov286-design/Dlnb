import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  X,
} from 'lucide-react';
import { t } from '@/lib/transliteration';
import { useLowStockCount } from '@/hooks/useSpareParts';
import { useCompletedTasksCount } from '@/hooks/useTasks';
import { useOverdueDebtsCount } from '@/hooks/useDebts';
import { useBackendStatus } from '@/hooks/useBackendStatus';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  
  // Only fetch counts for master users
  const isMaster = user?.role === 'master';
  const { isOnline: backendOnline } = useBackendStatus();
  const { data: lowStockCount = 0 } = useLowStockCount();
  const { data: completedTasksCount = 0 } = useCompletedTasksCount();
  const { data: overdueDebtsCount = 0 } = useOverdueDebtsCount(isMaster); // Faqat master uchun

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
    // Sahifani yangilash
    window.location.reload();
  };

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
    return location.pathname === path;
  };

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

  // Escape key ni eshitish
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Body scroll ni bloklash
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-[101] w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-out lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className={`relative flex h-24 items-center px-4 justify-between bg-gradient-to-r ${getRoleGradient()}`}>
            <div className="absolute inset-0 bg-black opacity-5"></div>

            {/* Logo and Site Name */}
            <div className="relative z-10 flex items-center gap-3">
              <div>
                <span className="block text-xl font-bold text-white drop-shadow-lg">Dalnoboy Shop</span>
                <span className="block text-[10px] text-white/80 font-medium">Professional Service</span>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="relative z-50 p-2 rounded-lg bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User Info */}
          <div className="border-b border-gray-100 p-4">
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
          <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
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
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={`relative flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    active
                      ? `bg-gradient-to-r ${getActiveGradient()} text-white shadow-lg`
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {active && (
                    <div className="absolute inset-0 bg-white opacity-10 rounded-xl"></div>
                  )}
                  <Icon
                    className={`h-5 w-5 flex-shrink-0 relative z-10 mr-3 ${
                      active
                        ? 'text-white'
                        : 'text-gray-400'
                    }`}
                  />
                  <span className="relative z-10 truncate">{item.name}</span>
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
                    <div className="ml-auto relative z-10">
                      <div className="h-2 w-2 rounded-full bg-white animate-pulse"></div>
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer Actions */}
          <div className="border-t border-gray-100 p-4 space-y-2">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex w-full items-center rounded-xl px-4 py-3 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-blue-50 hover:text-blue-600"
            >
              <Globe className="h-5 w-5 text-gray-400 mr-3" />
              <span>{language === 'latin' ? 'Кирил' : 'Lotin'}</span>
            </button>

            {/* Logout */}
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="flex w-full items-center rounded-xl px-4 py-3 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-5 w-5 text-gray-400 mr-3" />
              <span>{t("Chiqish", language)}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
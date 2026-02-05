import React, { useState } from 'react';
import { useApprentices } from '@/hooks/useUsers';
import CreateApprenticeModal from '@/components/CreateApprenticeModal';
import ViewApprenticeModal from '@/components/ViewApprenticeModal';
import EditApprenticeModal from '@/components/EditApprenticeModal';
import DeleteApprenticeModal from '@/components/DeleteApprenticeModal';
import { Plus, Search, Users, Calendar, TrendingUp, Award, Eye, Edit, Trash2, CheckCircle, Target, Mail, Wallet } from 'lucide-react';
import { User } from '@/types';
import { t } from '@/lib/transliteration';


const Apprentices: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedApprentice, setSelectedApprentice] = useState<User | null>(null);
  const { data: apprenticesData, isLoading, refetch } = useApprentices();

  // localStorage'dan tilni o'qish
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  const apprentices = (apprenticesData as any)?.users || [];

  const filteredApprentices = apprentices.filter((apprentice: User) =>
    apprentice.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    apprentice.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    apprentice.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAvatarGradient = (index: number) => {
    const gradients = [
      'from-blue-500 to-indigo-600',
      'from-purple-500 to-pink-600',
      'from-green-500 to-teal-600',
      'from-orange-500 to-red-600',
      'from-cyan-500 to-blue-600',
      'from-violet-500 to-purple-600',
    ];
    return gradients[index % gradients.length];
  };

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 bg-green-100';
    if (percentage >= 60) return 'text-blue-600 bg-blue-100';
    if (percentage >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const handleViewApprentice = (apprentice: User) => {
    setSelectedApprentice(apprentice);
    setIsViewModalOpen(true);
  };

  const handleEditApprentice = (apprentice: User) => {
    setSelectedApprentice(apprentice);
    setIsEditModalOpen(true);
  };

  const handleDeleteApprentice = (apprentice: User) => {
    setSelectedApprentice(apprentice);
    setIsDeleteModalOpen(true);
  };

  const handleUpdate = () => {
    refetch();
  };

  const handleDelete = () => {
    refetch();
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-6 sm:pb-8 px-4 sm:px-0">
      {/* Header with Gradient Background */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-4 sm:p-6 lg:p-8 shadow-xl">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">{t("Shogirdlar", language)}</h1>
              <p className="text-blue-100 text-sm sm:text-base lg:text-lg">
                {t("Shogirdlarni boshqaring va ularning rivojlanishini kuzating", language)}
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm sm:text-base w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              <span className="hidden sm:inline">{t("Yangi shogird", language)}</span>
              <span className="sm:hidden">{t("Qo'shish", language)}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar with Enhanced Design */}
      <div className="relative w-full max-w-2xl">
        <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
        <input
          type="text"
          placeholder={t("Ism, username yoki email bo'yicha qidirish...", language)}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400 text-sm sm:text-base"
        />
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-4 sm:p-6 border border-blue-200 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-blue-600 mb-1">{t("Jami shogirdlar", language)}</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-900">{apprentices.length}</p>
            </div>
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 items-center justify-center rounded-xl bg-blue-500 shadow-lg">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-green-100 p-4 sm:p-6 border border-green-200 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-green-600 mb-1">{t("Faol shogirdlar", language)}</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-900">{apprentices.length}</p>
            </div>
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 items-center justify-center rounded-xl bg-green-500 shadow-lg">
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 p-4 sm:p-6 border border-purple-200 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-purple-600 mb-1">{t("Bu oy qo'shilgan", language)}</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-900">
                {apprentices.filter((apprentice: User) => {
                  const createdDate = new Date(apprentice.createdAt);
                  const currentDate = new Date();
                  return createdDate.getMonth() === currentDate.getMonth() && 
                         createdDate.getFullYear() === currentDate.getFullYear();
                }).length}
              </p>
            </div>
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 items-center justify-center rounded-xl bg-purple-500 shadow-lg">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 p-4 sm:p-6 border border-orange-200 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-orange-600 mb-1">{t("O'rtacha natija", language)}</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-900">85%</p>
            </div>
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 items-center justify-center rounded-xl bg-orange-500 shadow-lg">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Apprentices Grid with Enhanced Cards */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 sm:py-16">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-blue-200"></div>
            <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
          </div>
          <p className="mt-4 text-sm sm:text-base text-gray-600 font-medium">Shogirdlar yuklanmoqda...</p>
        </div>
      ) : filteredApprentices.length === 0 ? (
        <div className="text-center py-12 sm:py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 mx-4 sm:mx-0">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-200 mb-4">
            <Users className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 px-4">
            {searchTerm ? 'Shogirdlar topilmadi' : 'Shogirdlar yo\'q'}
          </h3>
          <p className="text-sm sm:text-base text-gray-600 mb-6 max-w-md mx-auto px-4">
            {searchTerm 
              ? 'Qidiruv so\'rovingizga mos shogirdlar topilmadi. Boshqa kalit so\'zlarni sinab ko\'ring.'
              : 'Hozircha tizimda shogirdlar yo\'q. Birinchi shogirdni qo\'shishdan boshlang.'
            }
          </p>
          {!searchTerm && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Birinchi shogirdni qo'shish
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filteredApprentices.map((apprentice: User, index: number) => {
            // Real data from backend
            const stats = apprentice.stats || {
              totalTasks: 0,
              completedTasks: 0,
              approvedTasks: 0,
              performance: 0,
              awards: 0
            };
            
            return (
              <div 
                key={apprentice._id} 
                className="group relative bg-white rounded-xl border-2 border-gray-100 hover:border-blue-300 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Card Header with Gradient */}
                <div className={`h-16 sm:h-20 bg-gradient-to-r ${getAvatarGradient(index)} relative rounded-t-xl`}>
                  <div className="absolute inset-0 bg-black opacity-10 rounded-t-xl"></div>
                  <div className="absolute -bottom-6 sm:-bottom-8 left-4 sm:left-5">
                    {apprentice.profileImage ? (
                      <img 
                        src={`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${apprentice.profileImage}`}
                        alt={apprentice.name}
                        className="h-12 w-12 sm:h-16 sm:w-16 rounded-xl object-cover shadow-lg border-4 border-white"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className={`flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-xl bg-gradient-to-br ${getAvatarGradient(index)} text-white font-bold text-lg sm:text-xl shadow-lg border-4 border-white`}
                      style={{ display: apprentice.profileImage ? 'none' : 'flex' }}
                    >
                      {apprentice.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="pt-8 sm:pt-10 px-4 sm:px-5 pb-4 sm:pb-5">
                  {/* Name and Username */}
                  <div className="mb-3">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors truncate">
                      {apprentice.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 flex items-center">
                      <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                      <span className="truncate">@{apprentice.username}</span>
                    </p>
                    {apprentice.profession && (
                      <p className="text-xs text-blue-600 font-medium mt-1 truncate">
                        {apprentice.profession}
                      </p>
                    )}
                    {apprentice.experience !== undefined && apprentice.experience > 0 && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {t('Tajriba', language)}: {apprentice.experience} {t('yil', language)}
                      </p>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 mb-3 pb-3 border-b border-gray-100">
                    <div className="flex items-center text-xs sm:text-sm text-gray-600">
                      <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{apprentice.email}</span>
                    </div>
                    <div className="flex items-center text-xs sm:text-sm text-gray-600">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-gray-400 flex-shrink-0" />
                      <span>{new Date(apprentice.createdAt).toLocaleDateString('uz-UZ')}</span>
                    </div>
                  </div>

                  {/* Performance Stats */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs sm:text-sm font-medium text-gray-700">Samaradorlik</span>
                      <span className={`text-xs sm:text-sm font-bold px-2 py-1 rounded-lg ${getPerformanceColor(stats.performance)}`}>
                        {stats.performance}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
                        style={{ width: `${stats.performance}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Task Stats Grid */}
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-3">
                    <div className="text-center p-2 sm:p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                      <Target className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mx-auto mb-1" />
                      <p className="text-sm sm:text-base font-bold text-blue-900">{stats.totalTasks}</p>
                      <p className="text-xs text-blue-600 font-medium">{t("Vazifalar", language)}</p>
                    </div>
                    <div className="text-center p-2 sm:p-2.5 bg-green-50 rounded-lg border border-green-100">
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mx-auto mb-1" />
                      <p className="text-sm sm:text-base font-bold text-green-900">{stats.completedTasks}</p>
                      <p className="text-xs text-green-600 font-medium">{t("Bajarilgan", language)}</p>
                    </div>
                    <div className="text-center p-2 sm:p-2.5 bg-purple-50 rounded-lg border border-purple-100">
                      <Award className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 mx-auto mb-1" />
                      <p className="text-sm sm:text-base font-bold text-purple-900">{stats.awards}</p>
                      <p className="text-xs text-purple-600 font-medium">{t("Mukofot", language)}</p>
                    </div>
                  </div>

                  {/* Earnings Display */}
                  <div className="mb-4 p-2.5 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-200">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 shadow-sm">
                        <Wallet className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-emerald-600 font-medium">{t("Jami daromad", language)}</p>
                        <p className="text-sm sm:text-base font-bold text-emerald-900 truncate">
                          {(apprentice.totalEarnings || 0).toLocaleString()} {t("so'm", language)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleViewApprentice(apprentice)}
                      className="flex-1 flex items-center justify-center px-3 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
                      title={t("Ko'rish", language)}
                    >
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">{t("Ko'rish", language)}</span>
                      <span className="sm:hidden">{t("Ko'rish", language)}</span>
                    </button>
                    <button 
                      onClick={() => handleEditApprentice(apprentice)}
                      className="flex items-center justify-center p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all duration-200"
                      title={t("Tahrirlash", language)}
                    >
                      <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteApprentice(apprentice)}
                      className="flex items-center justify-center p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all duration-200"
                      title={t("O'chirish", language)}
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="absolute top-16 sm:top-24 right-3 sm:right-4">
                  <span className="inline-flex items-center px-2 sm:px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200 shadow-sm">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 sm:mr-1.5 animate-pulse"></span>
                    <span className="hidden sm:inline">{t("Faol", language)}</span>
                    <span className="sm:hidden">●</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Apprentice Modal */}
      <CreateApprenticeModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* View Apprentice Modal */}
      <ViewApprenticeModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedApprentice(null);
        }}
        apprentice={selectedApprentice}
      />

      {/* Edit Apprentice Modal */}
      <EditApprenticeModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedApprentice(null);
        }}
        apprentice={selectedApprentice}
        onUpdate={handleUpdate}
      />

      {/* Delete Apprentice Modal */}
      <DeleteApprenticeModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedApprentice(null);
        }}
        apprentice={selectedApprentice}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default Apprentices;
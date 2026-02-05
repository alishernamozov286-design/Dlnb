import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, ArrowRight, User } from 'lucide-react';
import { formatPhoneNumber, getPhoneDigits } from '@/lib/phoneUtils';
import toast from 'react-hot-toast';
import { t } from '@/lib/transliteration';

interface LoginForm {
  username: string;
  password: string;
  phone: string;
}

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'master' | 'apprentice' | null>(null);
  const [phoneValue, setPhoneValue] = useState('');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  // localStorage'dan tilni o'qish (faqat o'qish, o'zgartirish yo'q)
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  // Online/Offline status listener
  React.useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      if (selectedRole === 'apprentice') {
        // Shogirt - username va telefon raqam bilan kirish (faqat raqamlarni yuborish)
        await login(data.username, '', getPhoneDigits(phoneValue));
      } else {
        // Ustoz - username va parol bilan kirish
        await login(data.username, data.password);
      }
      toast.success(t('Xush kelibsiz!', language));
      navigate('/app/dashboard');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 relative overflow-hidden">
      {/* Offline Indicator */}
      {isOffline && (
        <div className="fixed top-4 right-4 z-50 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          <span className="font-medium text-sm">{t('Offline rejim', language)}</span>
        </div>
      )}

      {/* Animated Background Circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <Link to="/" className="flex justify-center mb-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl blur-xl opacity-40 animate-pulse group-hover:opacity-60 transition-opacity"></div>
            <div className="relative bg-white rounded-2xl shadow-xl ring-2 ring-white p-3 group-hover:scale-105 transition-transform">
              <div className="h-20 w-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <User className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>
        </Link>

        {/* App Name */}
        <div className="text-center mb-5">
          <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-1">
            Dalnoboy Shop
          </h1>
          <p className="text-xs text-gray-600 font-medium">Professional Service Management</p>
        </div>

        {/* Login Card - Compact */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl blur-xl opacity-20"></div>
          <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-5">
            {/* Header - Compact */}
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-2 shadow-lg">
                <User className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                {t("Xush kelibsiz!", language)}
              </h2>
              <p className="text-xs text-gray-600">
                {isOffline 
                  ? t("Offline rejimda avval login qilgan hisobingizga kirishingiz mumkin", language)
                  : t("Hisobingizga kiring", language)
                }
              </p>
            </div>

          {/* Login Form - Compact */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            {/* Role Selection */}
            {!selectedRole ? (
              <div className="space-y-2">
                <p className="text-center text-xs font-semibold text-gray-700 mb-2">
                  {t("Kim sifatida kirmoqchisiz?", language)}
                </p>
                
                {/* Master Button - Compact */}
                <button
                  type="button"
                  onClick={() => setSelectedRole('master')}
                  className="group w-full p-3 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl hover:border-blue-400 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="absolute inset-0 bg-blue-500 rounded-full blur-sm opacity-50 group-hover:opacity-75 transition-opacity"></div>
                        <div className="relative w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                          <User className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-sm text-blue-900">{t("Ustoz", language)}</p>
                        <p className="text-xs text-blue-600">{t("Username va parol", language)}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                {/* Apprentice Button - Compact */}
                <button
                  type="button"
                  onClick={() => setSelectedRole('apprentice')}
                  className="group w-full p-3 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl hover:border-green-400 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="absolute inset-0 bg-green-500 rounded-full blur-sm opacity-50 group-hover:opacity-75 transition-opacity"></div>
                        <div className="relative w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                          <User className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-sm text-green-900">{t("Shogird", language)}</p>
                        <p className="text-xs text-green-600">{t("Telefon raqam", language)}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-green-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </div>
            ) : (
              <>
                {/* Back Button - Compact */}
                <button
                  type="button"
                  onClick={() => setSelectedRole(null)}
                  className="inline-flex items-center text-xs text-gray-600 hover:text-blue-600 font-medium mb-3 group"
                >
                  <ArrowRight className="h-3 w-3 mr-1 rotate-180 group-hover:-translate-x-1 transition-transform" />
                  {t("Orqaga", language)}
                </button>

                {/* Role Badge - Compact */}
                <div className="flex justify-center mb-4">
                  <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-semibold shadow-lg ${
                    selectedRole === 'master' 
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white' 
                      : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                  }`}>
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                      <User className="h-3 w-3" />
                    </div>
                    <span>{selectedRole === 'master' ? t("Ustoz", language) : t("Shogird", language)}</span>
                  </div>
                </div>

                {selectedRole === 'master' ? (
                  <>
                    {/* Username Field */}
                    <div className="group">
                      <label htmlFor="username" className="block text-xs font-semibold text-gray-700 mb-1.5">
                        {t("Foydalanuvchi nomi", language)}
                      </label>
                      <div className="relative">
                        <input
                          {...register('username', {
                            required: selectedRole === 'master' ? t('Foydalanuvchi nomi kiritilishi shart', language) : false
                          })}
                          type="text"
                          className="w-full px-3 py-2.5 text-sm bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                          placeholder={t("Foydalanuvchi nomingizni kiriting", language)}
                        />
                      </div>
                      {errors.username && (
                        <p className="mt-1 text-xs text-red-600 flex items-center">
                          <span className="w-1 h-1 bg-red-600 rounded-full mr-1.5"></span>
                          {errors.username.message}
                        </p>
                      )}
                    </div>

                    {/* Password Field */}
                    <div className="group">
                      <label htmlFor="password" className="block text-xs font-semibold text-gray-700 mb-1.5">
                        {t("Parol", language)}
                      </label>
                      <div className="relative">
                        <input
                          {...register('password', {
                            required: selectedRole === 'master' ? t('Parol kiritilishi shart', language) : false
                          })}
                          type={showPassword ? 'text' : 'password'}
                          className="w-full px-3 py-2.5 pr-11 text-sm bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                          placeholder={t("Parolingizni kiriting", language)}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-blue-600 transition-colors"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          <div className="w-7 h-7 rounded-full bg-gray-100 hover:bg-blue-50 flex items-center justify-center transition-colors">
                            {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </div>
                        </button>
                      </div>
                      {errors.password && (
                        <p className="mt-1 text-xs text-red-600 flex items-center">
                          <span className="w-1 h-1 bg-red-600 rounded-full mr-1.5"></span>
                          {errors.password.message}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Username Field for Apprentice */}
                    <div className="group">
                      <label htmlFor="username" className="block text-xs font-semibold text-gray-700 mb-1.5">
                        {t("Foydalanuvchi nomi", language)}
                      </label>
                      <div className="relative">
                        <input
                          {...register('username', {
                            required: selectedRole === 'apprentice' ? t('Foydalanuvchi nomi kiritilishi shart', language) : false
                          })}
                          type="text"
                          className="w-full px-3 py-2.5 text-sm bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100 transition-all outline-none"
                          placeholder={t("Foydalanuvchi nomingizni kiriting", language)}
                        />
                      </div>
                      {errors.username && (
                        <p className="mt-1 text-xs text-red-600 flex items-center">
                          <span className="w-1 h-1 bg-red-600 rounded-full mr-1.5"></span>
                          {errors.username.message}
                        </p>
                      )}
                    </div>

                    {/* Phone Field */}
                    <div className="group">
                      <label htmlFor="phone" className="block text-xs font-semibold text-gray-700 mb-1.5">
                        {t("Telefon raqam", language)}
                      </label>
                      <div className="relative">
                        <input
                          {...register('phone', {
                            required: selectedRole === 'apprentice' ? t('Telefon raqam kiritilishi shart', language) : false
                          })}
                          type="tel"
                          value={phoneValue}
                          onChange={(e) => {
                            const formatted = formatPhoneNumber(e.target.value);
                            setPhoneValue(formatted);
                          }}
                          className="w-full px-3 py-2.5 text-sm bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100 transition-all outline-none"
                          placeholder="+998 90 123 45 67"
                        />
                      </div>
                      {errors.phone && (
                        <p className="mt-1 text-xs text-red-600 flex items-center">
                          <span className="w-1 h-1 bg-red-600 rounded-full mr-1.5"></span>
                          {errors.phone.message}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-gray-500 flex items-center">
                        <span className="w-1 h-1 bg-gray-400 rounded-full mr-1.5"></span>
                        {t("Ustoz tomonidan berilgan ma'lumotlarni kiriting", language)}
                      </p>
                    </div>
                  </>
                )}

                {/* Submit Button - Circle Design */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`relative w-full py-3 rounded-xl font-bold text-sm text-white shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group ${
                    selectedRole === 'master'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                  }`}
                >
                  {/* Animated Circle Background */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full blur-2xl ${
                      selectedRole === 'master' ? 'bg-blue-400' : 'bg-green-400'
                    }`}></div>
                  </div>
                  
                  {isLoading ? (
                    <span className="relative flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t("Kirilmoqda...", language)}
                    </span>
                  ) : (
                    <span className="relative flex items-center justify-center">
                      {t("Kirish", language)}
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </button>
              </>
            )}
          </form>

          {/* Back to Home */}
          <div className="mt-3 text-center">
            <Link to="/" className="inline-flex items-center text-xs text-gray-600 hover:text-blue-600 font-medium group">
              <ArrowRight className="h-3 w-3 mr-1 rotate-180 group-hover:-translate-x-1 transition-transform" />
              {t("Bosh sahifaga qaytish", language)}
            </Link>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
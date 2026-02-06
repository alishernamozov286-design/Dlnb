import React, { useState, useEffect } from 'react';
import { X, User, Phone, Percent, AlertCircle, Edit3, Upload, Image as ImageIcon } from 'lucide-react';
import { User as UserType } from '@/types';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { formatPhoneNumber, validatePhoneNumber, getPhoneDigits } from '@/lib/phoneUtils';
import { t } from '@/lib/transliteration';
import api from '@/lib/api';


interface EditApprenticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  apprentice: UserType | null;
  onUpdate: () => void;
}

const EditApprenticeModal: React.FC<EditApprenticeModalProps> = ({ isOpen, onClose, apprentice, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    phone: '',
    percentage: 50,
    profession: '',
    experience: 0,
    profileImage: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // localStorage'dan tilni o'qish
  const language = React.useMemo<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  }, []);

  // Modal ochilganda body scroll ni bloklash
  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (apprentice) {
      setFormData({
        name: apprentice.name,
        username: apprentice.username,
        phone: apprentice.phone ? formatPhoneNumber(apprentice.phone) : '',
        percentage: apprentice.percentage || 50,
        profession: apprentice.profession || '',
        experience: apprentice.experience || 0,
        profileImage: apprentice.profileImage || ''
      });
      setImagePreview(apprentice.profileImage || '');
    }
  }, [apprentice]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.name.length < 2) {
      newErrors.name = t("Ism kamida 2 ta belgidan iborat bo'lishi kerak", language);
    }

    if (formData.username.length < 3) {
      newErrors.username = t("Username kamida 3 ta belgidan iborat bo'lishi kerak", language);
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = t("Username faqat harflar, raqamlar va _ belgisidan iborat bo'lishi mumkin", language);
    }

    if (!formData.phone || !validatePhoneNumber(formData.phone)) {
      newErrors.phone = t("Telefon raqam to'liq va to'g'ri formatda kiritilishi kerak", language);
    }

    if (formData.percentage < 0 || formData.percentage > 100) {
      newErrors.percentage = t("Foiz 0 dan 100 gacha bo'lishi kerak", language);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !apprentice) {
      return;
    }

    setIsLoading(true);
    try {
      // Upload image first if selected
      let profileImageUrl = formData.profileImage;
      if (imageFile) {
        profileImageUrl = await uploadImage();
      }

      const updateData: any = {
        name: formData.name,
        username: formData.username,
        phone: getPhoneDigits(formData.phone), // Faqat raqamlarni yuborish
        percentage: formData.percentage,
        profession: formData.profession,
        experience: formData.experience,
        profileImage: profileImageUrl
      };

      const response = await api.patch(`/auth/users/${apprentice._id}`, updateData);

      if (response.data) {
        onUpdate();
        onClose();
      }
    } catch (error: any) {
      console.error('Error updating apprentice:', error);
      alert(error.response?.data?.message || t('Xatolik yuz berdi', language));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Telefon raqam uchun formatlash
    if (name === 'phone') {
      const formatted = formatPhoneNumber(value);
      setFormData(prev => ({
        ...prev,
        phone: formatted
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert(t('Faqat rasm fayllari qabul qilinadi!', language));
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert(t('Rasm hajmi 5MB dan oshmasligi kerak!', language));
        return;
      }

      setImageFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string> => {
    if (!imageFile) return formData.profileImage;

    setIsUploadingImage(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('profileImage', imageFile);

      const response = await api.post('/auth/upload-profile-image', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data.imageUrl;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      alert(error.response?.data?.message || t('Rasm yuklashda xatolik yuz berdi', language));
      return formData.profileImage;
    } finally {
      setIsUploadingImage(false);
    }
  };

  if (!isOpen || !apprentice) return null;

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-2 sm:p-4">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-2">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 rounded-t-xl">
            <button onClick={onClose} className="absolute top-3 right-3 text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1 transition-colors">
              <X className="h-4 w-4" />
            </button>
            
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20">
                <Edit3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">{t('Shogirtni tahrirlash', language)}</h2>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4 space-y-3 max-h-[calc(100vh-120px)] overflow-y-auto scrollbar-hide">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-xs font-medium text-gray-700 mb-1">
                {t("To'liq ism", language)}
              </label>
              <div className="relative">
                <User className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className={`w-full pl-8 pr-3 py-2 text-sm border-2 rounded-lg focus:outline-none transition-all ${
                    errors.name 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-200 focus:border-blue-500'
                  }`}
                  placeholder={t("To'liq ism", language)}
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-[10px] text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-xs font-medium text-gray-700 mb-1">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">@</span>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className={`w-full pl-8 pr-3 py-2 text-sm border-2 rounded-lg focus:outline-none transition-all ${
                    errors.username 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-200 focus:border-blue-500'
                  }`}
                  placeholder="username"
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-[10px] text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.username}
                </p>
              )}
            </div>

            {/* Profile Image Upload */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t('Profil rasmi', language)}
              </label>
              <div className="flex items-center gap-3">
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview.startsWith('data:') ? imagePreview : `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${imagePreview}`}
                      alt="Preview" 
                      className="w-14 h-14 rounded-lg object-cover border-2 border-blue-200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview('');
                        setFormData(prev => ({ ...prev, profileImage: '' }));
                      }}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                    <ImageIcon className="h-6 w-6 text-gray-400" />
                  </div>
                )}
                
                <label className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-200 hover:bg-blue-100 transition-all">
                    <Upload className="h-3 w-3" />
                    <span className="text-xs font-medium">{t('Rasm yuklash', language)}</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Profession & Experience */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="profession" className="block text-xs font-medium text-gray-700 mb-1">
                  {t('Kasbi', language)}
                </label>
                <input
                  type="text"
                  id="profession"
                  name="profession"
                  value={formData.profession}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
                  placeholder={t("Avtomexanik", language)}
                />
              </div>

              <div>
                <label htmlFor="experience" className="block text-xs font-medium text-gray-700 mb-1">
                  {t('Tajriba (yil)', language)}
                </label>
                <input
                  type="number"
                  id="experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-all"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phone" className="block text-xs font-medium text-gray-700 mb-1">
                {t('Telefon raqam', language)}
              </label>
              <div className="relative">
                <Phone className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className={`w-full pl-8 pr-3 py-2 text-sm border-2 rounded-lg focus:outline-none transition-all ${
                    errors.phone 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-200 focus:border-blue-500'
                  }`}
                  placeholder="+998901234567"
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-[10px] text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Percentage */}
            <div>
              <label htmlFor="percentage" className="block text-xs font-medium text-gray-700 mb-1">
                {t('Foiz ulushi', language)} (%)
              </label>
              <div className="relative">
                <Percent className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  id="percentage"
                  name="percentage"
                  value={formData.percentage}
                  onChange={handleChange}
                  required
                  min="0"
                  max="100"
                  className={`w-full pl-8 pr-3 py-2 text-sm border-2 rounded-lg focus:outline-none transition-all ${
                    errors.percentage 
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-200 focus:border-blue-500'
                  }`}
                  placeholder="50"
                />
              </div>
              {errors.percentage && (
                <p className="mt-1 text-[10px] text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.percentage}
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {t('Bekor qilish', language)}
              </button>
              <button
                type="submit"
                disabled={isLoading || isUploadingImage}
                className="flex-1 px-3 py-2 text-xs font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all"
              >
                {isLoading || isUploadingImage ? t('Saqlanmoqda...', language) : t('Saqlash', language)}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditApprenticeModal;

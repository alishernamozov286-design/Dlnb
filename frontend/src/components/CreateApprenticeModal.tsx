import React, { useState } from 'react';
import { X, User, UserPlus, CheckCircle, AlertCircle, Upload, Image as ImageIcon, Phone, Percent } from 'lucide-react';
import { useCreateApprentice } from '@/hooks/useUsers';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { formatPhoneNumber, validatePhoneNumber, getPhoneDigits } from '@/lib/phoneUtils';
import api from '@/lib/api';

interface CreateApprenticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate?: (apprenticeData: any) => Promise<any>;
}

const CreateApprenticeModal: React.FC<CreateApprenticeModalProps> = ({ isOpen, onClose, onCreate }) => {
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const createApprenticeMutation = useCreateApprentice();
  
  // Modal ochilganda body scroll ni bloklash
  useBodyScrollLock(isOpen);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.name.length < 2) {
      newErrors.name = 'Ism kamida 2 ta belgidan iborat bo\'lishi kerak';
    }

    if (formData.username.length < 3) {
      newErrors.username = 'Username kamida 3 ta belgidan iborat bo\'lishi kerak';
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username faqat harflar, raqamlar va _ belgisidan iborat bo\'lishi mumkin';
    }

    if (!formData.phone || !validatePhoneNumber(formData.phone)) {
      newErrors.phone = 'Telefon raqam to\'liq va to\'g\'ri formatda kiritilishi kerak';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Upload image first if selected
      let profileImageUrl = formData.profileImage;
      if (imageFile) {
        profileImageUrl = await uploadImage();
        if (!profileImageUrl) {
          return; // Upload failed
        }
      }

      const apprenticeData = {
        ...formData,
        phone: getPhoneDigits(formData.phone), // Faqat raqamlarni yuborish
        profileImage: profileImageUrl,
        password: getPhoneDigits(formData.phone), // Telefon raqamni parol sifatida ishlatish
        role: 'apprentice'
      };

      // Agar onCreate prop berilgan bo'lsa, uni ishlatish (optimistic update)
      if (onCreate) {
        await onCreate(apprenticeData);
      } else {
        // Eski usul - mutation ishlatish
        await createApprenticeMutation.mutateAsync(apprenticeData);
      }
      
      // Form'ni tozalash
      setFormData({
        name: '',
        username: '',
        phone: '',
        percentage: 50,
        profession: '',
        experience: 0,
        profileImage: ''
      });
      setImageFile(null);
      setImagePreview('');
      setErrors({});
      onClose();
    } catch (error) {
      // Xatolik toast orqali ko'rsatiladi
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
    
    // Clear error when user starts typing
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
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Faqat rasm fayllari qabul qilinadi!');
        return;
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Rasm hajmi 5MB dan oshmasligi kerak!');
        return;
      }

      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string> => {
    if (!imageFile) return '';

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('profileImage', imageFile);

      const response = await api.post('/auth/upload-profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return response.data.imageUrl;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      alert(error.response?.data?.message || 'Rasm yuklashda xatolik yuz berdi');
      return '';
    } finally {
      setIsUploadingImage(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[9999] p-2 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-hidden mx-2 sm:mx-0 my-4 sm:my-0 transform transition-all animate-slideUp">
        {/* Header with Gradient */}
        <div className="relative overflow-hidden rounded-t-xl sm:rounded-t-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 sm:px-6 py-4 sm:py-6">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-white bg-opacity-20 backdrop-blur-sm mr-3">
                <UserPlus className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-white">Yangi shogird</h2>
                <p className="text-blue-100 text-xs sm:text-sm">Shogird ma'lumotlarini kiriting</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1.5 sm:p-2 transition-all duration-200"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-h-[calc(95vh-120px)] sm:max-h-[calc(90vh-120px)] overflow-y-auto">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
              To'liq ism
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className={`w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border-2 rounded-xl focus:outline-none transition-all duration-200 text-sm sm:text-base ${
                  errors.name 
                    ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
                    : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                }`}
                placeholder="Masalan: Alisher Navoiy"
              />
              {errors.name && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                </div>
              )}
            </div>
            {errors.name && (
              <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center">
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
              Foydalanuvchi nomi
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400 font-medium text-sm sm:text-base">@</span>
              </div>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className={`w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border-2 rounded-xl focus:outline-none transition-all duration-200 text-sm sm:text-base ${
                  errors.username 
                    ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
                    : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                }`}
                placeholder="username"
              />
              {errors.username && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                </div>
              )}
            </div>
            {errors.username && (
              <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center">
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                {errors.username}
              </p>
            )}
          </div>

          {/* Profile Image Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Profil rasmi
            </label>
            <div className="flex items-center gap-4">
              {imagePreview ? (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-20 h-20 rounded-xl object-cover border-2 border-blue-200"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview('');
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                </div>
              )}
              
              <label className="flex-1 cursor-pointer">
                <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 rounded-xl border-2 border-blue-200 hover:bg-blue-100 transition-all">
                  <Upload className="h-4 w-4" />
                  <span className="text-sm font-medium">Rasm yuklash</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              JPG, PNG, GIF yoki WebP (max 5MB)
            </p>
          </div>

          {/* Profession */}
          <div>
            <label htmlFor="profession" className="block text-sm font-semibold text-gray-700 mb-2">
              Kasbi
            </label>
            <input
              type="text"
              id="profession"
              name="profession"
              value={formData.profession}
              onChange={handleChange}
              className="w-full px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm sm:text-base"
              placeholder="Masalan: Avtomexanik"
            />
          </div>

          {/* Experience */}
          <div>
            <label htmlFor="experience" className="block text-sm font-semibold text-gray-700 mb-2">
              Tajriba (yillarda)
            </label>
            <input
              type="number"
              id="experience"
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              min="0"
              className="w-full px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm sm:text-base"
              placeholder="0"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
              Telefon raqam *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              </div>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className={`w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border-2 rounded-xl focus:outline-none transition-all duration-200 text-sm sm:text-base ${
                  errors.phone 
                    ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
                    : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                }`}
                placeholder="+998 90 123 45 67"
              />
              {errors.phone && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                </div>
              )}
            </div>
            {errors.phone ? (
              <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-center">
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                {errors.phone}
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">
                Shogird bu raqam bilan tizimga kiradi (parolsiz)
              </p>
            )}
          </div>

          {/* Percentage */}
          <div>
            <label htmlFor="percentage" className="block text-sm font-semibold text-gray-700 mb-2">
              Foiz (%)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Percent className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              </div>
              <input
                type="number"
                id="percentage"
                name="percentage"
                value={formData.percentage}
                onChange={handleChange}
                min="0"
                max="100"
                className="w-full pl-9 sm:pl-10 pr-10 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm sm:text-base"
                placeholder="50"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 font-medium">%</span>
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Shogird vazifalardan qancha foiz oladi (0-100)
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-3 sm:p-4">
            <div className="flex items-start">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs sm:text-sm font-medium text-blue-900 mb-1">Eslatma</p>
                <p className="text-xs sm:text-sm text-blue-700">
                  Shogird yaratilgandan so'ng, u telefon raqami bilan tizimga kirib, vazifalarni ko'ra oladi va bajarishi mumkin. Parol kerak emas.
                </p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-all duration-200 order-2 sm:order-1"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={createApprenticeMutation.isPending || isUploadingImage}
              className="w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 order-1 sm:order-2"
            >
              {isUploadingImage ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Rasm yuklanmoqda...
                </span>
              ) : (
                'Shogird yaratish'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateApprenticeModal;
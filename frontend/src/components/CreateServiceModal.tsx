import { useState, useEffect } from 'react';
import { X, Upload, Image as ImageIcon, Edit2, Trash2, Plus, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { API_CONFIG } from '../config/api.config';
import { usePublicServices, useDeleteService, useUpdateService } from '@/hooks/useServices';
import { t } from '@/lib/transliteration';
import { getImageUrl } from '@/lib/api';

interface CreateServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateServiceModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateServiceModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [deleteConfirmService, setDeleteConfirmService] = useState<any>(null);
  const [language] = useState<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  });

  const { data: servicesData, isLoading: servicesLoading, refetch } = usePublicServices();
  const deleteServiceMutation = useDeleteService();
  const updateServiceMutation = useUpdateService();

  // Debug: Log services data
  useEffect(() => {
    if (servicesData) {
      console.log('📦 Services Data:', servicesData);
      console.log('📦 Services Array:', servicesData?.services);
    }
  }, [servicesData]);

  useEffect(() => {
    if (!isOpen) {
      setFormData({ name: '', description: '' });
      setImageFile(null);
      setImagePreview('');
      setError('');
      setShowForm(false);
      setEditingService(null);
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
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

  useEffect(() => {
    if (editingService) {
      setFormData({
        name: editingService.name,
        description: editingService.description,
      });
      if (editingService.imageUrl) {
        // Set the full image URL for preview
        setImagePreview(getImageUrl(editingService.imageUrl));
      }
      setShowForm(true);
    }
  }, [editingService]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError(t('Rasm hajmi 5MB dan oshmasligi kerak', language));
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError(t('Faqat JPG, PNG yoki WEBP formatdagi rasmlar qabul qilinadi', language));
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError(t('Xizmat nomini kiriting', language));
      return;
    }

    if (!formData.description.trim()) {
      setError(t('Tavsifni kiriting', language));
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      if (editingService) {
        await updateServiceMutation.mutateAsync({
          id: editingService._id,
          formData: formDataToSend,
        });
      } else {
        const response = await fetch(`${API_CONFIG.BASE_URL}/services`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataToSend,
        });

        const data = await response.json();

        if (!response.ok) {
          console.error('Server response:', data);
          throw new Error(data.message || t('Xizmat yaratishda xatolik', language));
        }
      }

      await refetch();
      onSuccess();
      setShowForm(false);
      setEditingService(null);
      setFormData({ name: '', description: '' });
      setImageFile(null);
      setImagePreview('');
    } catch (err: any) {
      setError(err.message || t('Xizmat yaratishda xatolik', language));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmService) return;

    try {
      await deleteServiceMutation.mutateAsync(deleteConfirmService._id);
      await refetch();
      onSuccess();
      setDeleteConfirmService(null);
    } catch (err: any) {
      setError(err.message || t('Xizmatni o\'chirishda xatolik', language));
      setDeleteConfirmService(null);
    }
  };

  const handleEdit = (service: any) => {
    setEditingService(service);
  };

  const handleCancelEdit = () => {
    setEditingService(null);
    setShowForm(false);
    setFormData({ name: '', description: '' });
    setImageFile(null);
    setImagePreview('');
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl animate-scale-in">
        {/* Compact Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 flex items-center justify-between z-10 shadow-lg">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-sm sm:text-base font-bold text-white">
              {showForm 
                ? (editingService ? t('Tahrirlash', language) : t('Yangi Xizmat', language))
                : t('Xizmatlar', language)
              }
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/20 transition-all duration-200 flex-shrink-0 rounded-lg p-1"
            disabled={loading}
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {!showForm ? (
          <div className="p-3 sm:p-5 max-h-[calc(85vh-50px)] overflow-y-auto">
            {/* Compact Add Button */}
            <button
              onClick={() => setShowForm(true)}
              className="w-full mb-3 sm:mb-4 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] font-medium"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">{t('Yangi xizmat qo\'shish', language)}</span>
            </button>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-2.5 rounded-lg text-xs sm:text-sm mb-3 flex items-start gap-2 animate-slide-down">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {servicesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl p-3 h-36"></div>
                ))}
              </div>
            ) : servicesData?.services && servicesData.services.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {servicesData.services.map((service: any, index: number) => (
                  <div
                    key={service._id}
                    className="group relative bg-white border-2 border-gray-100 rounded-xl overflow-hidden hover:border-blue-300 hover:shadow-lg transition-all duration-300"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Compact Image */}
                    {service.imageUrl ? (
                      <div className="relative h-28 sm:h-32 overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50">
                        <img
                          src={getImageUrl(service.imageUrl)}
                          alt={service.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="h-28 sm:h-32 bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                        <ImageIcon className="w-10 h-10 text-blue-300" />
                      </div>
                    )}

                    {/* Compact Content */}
                    <div className="p-2.5 sm:p-3">
                      <h3 className="font-bold text-sm sm:text-base text-gray-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {service.name}
                      </h3>
                      <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                        {service.description}
                      </p>

                      {/* Compact Buttons */}
                      <div className="flex gap-1.5 sm:gap-2">
                        <button
                          onClick={() => handleEdit(service)}
                          className="flex-1 px-2.5 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-1 text-xs font-medium transition-all"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>{t('Tahrir', language)}</span>
                        </button>
                        <button
                          onClick={() => setDeleteConfirmService(service)}
                          className="flex-1 px-2.5 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 flex items-center justify-center gap-1 text-xs font-medium transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>{t('O\'chir', language)}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl mb-3">
                  <ImageIcon className="w-7 h-7 text-blue-400" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">
                  {t('Hozircha xizmatlar yo\'q', language)}
                </h3>
                <p className="text-sm text-gray-500 mb-3">
                  {t('Birinchi xizmatni qo\'shing', language)}
                </p>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-5 sm:space-y-6 max-h-[calc(92vh-80px)] overflow-y-auto">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-xl text-sm sm:text-base flex items-start gap-3 animate-slide-down">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Service Name */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm sm:text-base font-semibold text-gray-900">
                <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                {t('Xizmat Nomi', language)} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 sm:px-5 py-3 sm:py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm sm:text-base placeholder:text-gray-400 hover:border-gray-300"
                placeholder={t("Masalan: Avtomobil ta'mirlash", language)}
                disabled={loading}
                required
              />
            </div>

            {/* Service Description */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm sm:text-base font-semibold text-gray-900">
                <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                {t('Tavsif', language)} <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                className="w-full px-4 sm:px-5 py-3 sm:py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none text-sm sm:text-base placeholder:text-gray-400 hover:border-gray-300"
                placeholder={t("Xizmat haqida batafsil ma'lumot...", language)}
                disabled={loading}
                required
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm sm:text-base font-semibold text-gray-900">
                <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                {t('Rasm', language)}
              </label>
              <div className="space-y-3">
                {imagePreview ? (
                  <div className="relative group">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 sm:h-56 object-cover rounded-2xl shadow-lg"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview('');
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-xl transition-all duration-200 shadow-lg transform hover:scale-110"
                        disabled={loading}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-48 sm:h-56 border-3 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-300 group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <div className="h-16 w-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <Upload className="w-8 h-8 text-blue-600" />
                      </div>
                      <p className="text-sm sm:text-base text-gray-700 mb-2 font-medium px-2 text-center">
                        {t('Rasm yuklash uchun bosing', language)}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 px-2 text-center">
                        PNG, JPG {t('yoki', language)} WEBP (max 5MB)
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleImageChange}
                      disabled={loading}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t-2 border-gray-100">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="w-full sm:flex-1 px-5 py-3 sm:py-3.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 text-sm sm:text-base font-semibold"
                disabled={loading}
              >
                {t('Bekor qilish', language)}
              </button>
              <button
                type="submit"
                className="w-full sm:flex-1 px-5 py-3 sm:py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('Saqlanmoqda...', language)}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    {editingService ? t('Yangilash', language) : t('Saqlash', language)}
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmService && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl animate-scale-in overflow-hidden">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-red-500 via-red-600 to-pink-600 p-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
                <Trash2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                {t('Xizmatni o\'chirish', language)}
              </h3>
              <p className="text-sm text-white/90">
                {t('Bu amalni qaytarib bo\'lmaydi', language)}
              </p>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-base text-gray-700 text-center mb-5">
                {t('Ushbu xizmatni o\'chirishni xohlaysizmi?', language)}
              </p>

              {/* Service Info Card */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 mb-6 border-2 border-gray-200">
                <div className="flex items-start gap-3">
                  {deleteConfirmService.imageUrl && (
                    <img
                      src={getImageUrl(deleteConfirmService.imageUrl)}
                      alt={deleteConfirmService.name}
                      className="w-16 h-16 object-cover rounded-xl flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-gray-900 mb-1 line-clamp-1">
                      {deleteConfirmService.name}
                    </p>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {deleteConfirmService.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Warning Message */}
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl mb-6 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">
                  {t('Diqqat! O\'chirilgan xizmatni qayta tiklab bo\'lmaydi.', language)}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setDeleteConfirmService(null)}
                  className="flex-1 px-5 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-semibold"
                  disabled={deleteServiceMutation.isPending}
                >
                  {t('Bekor qilish', language)}
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-5 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                  disabled={deleteServiceMutation.isPending}
                >
                  {deleteServiceMutation.isPending ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t('O\'chirilmoqda...', language)}
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5" />
                      {t('Ha, o\'chirish', language)}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

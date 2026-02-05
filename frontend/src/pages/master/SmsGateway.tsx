import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Smartphone, Plus, Trash2, Activity, MessageSquare, Clock } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { t } from '@/lib/transliteration';
import LoadingSpinner from '@/components/LoadingSpinner';

const SmsGateway: React.FC = () => {
  const [language] = useState<'latin' | 'cyrillic'>(() => {
    const savedLanguage = localStorage.getItem('language');
    return (savedLanguage as 'latin' | 'cyrillic') || 'latin';
  });

  const [activeTab, setActiveTab] = useState<'gateways' | 'logs' | 'stats'>('gateways');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newGateway, setNewGateway] = useState({ name: '', simNumber: '' });

  const queryClient = useQueryClient();

  // Fetch gateways
  const { data: gatewaysData, isLoading: gatewaysLoading } = useQuery({
    queryKey: ['sms-gateways'],
    queryFn: async () => {
      const response = await api.get('/sms/gateways');
      return response.data;
    },
  });

  // Fetch logs
  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['sms-logs'],
    queryFn: async () => {
      const response = await api.get('/sms/logs');
      return response.data;
    },
    enabled: activeTab === 'logs',
  });

  // Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ['sms-stats'],
    queryFn: async () => {
      const response = await api.get('/sms/stats');
      return response.data;
    },
  });

  const gateways = gatewaysData?.gateways || [];
  const logs = logsData?.messages || [];
  const stats = statsData?.stats || {};

  // Create gateway mutation
  const createGatewayMutation = useMutation({
    mutationFn: async (data: { name: string; simNumber: string }) => {
      const response = await api.post('/sms/gateways', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-gateways'] });
      toast.success(t('Gateway yaratildi', language));
      setIsCreateModalOpen(false);
      setNewGateway({ name: '', simNumber: '' });
    },
    onError: () => {
      toast.error(t('Xatolik yuz berdi', language));
    },
  });

  // Delete gateway mutation
  const deleteGatewayMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/sms/gateways/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-gateways'] });
      toast.success(t('Gateway o\'chirildi', language));
    },
    onError: () => {
      toast.error(t('Xatolik yuz berdi', language));
    },
  });

  const handleCreateGateway = () => {
    if (!newGateway.name) {
      toast.error(t('Gateway nomini kiriting', language));
      return;
    }
    createGatewayMutation.mutate(newGateway);
  };

  const isGatewayOnline = (lastHeartbeat?: string) => {
    if (!lastHeartbeat) return false;
    const diff = Date.now() - new Date(lastHeartbeat).getTime();
    return diff < 60000; // 1 daqiqadan kam
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('uz-UZ');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'queued':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (gatewaysLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('SMS Gateway', language)}</h1>
          <p className="text-gray-600 mt-1">{t('SMS yuborish tizimini boshqaring', language)}</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
        >
          <Plus className="h-5 w-5" />
          {t('Yangi Gateway', language)}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">{t('Yuborilgan', language)}</p>
              <p className="text-3xl font-bold mt-2">{stats.totalSent || 0}</p>
            </div>
            <MessageSquare className="h-12 w-12 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">{t('Xatolik', language)}</p>
              <p className="text-3xl font-bold mt-2">{stats.totalFailed || 0}</p>
            </div>
            <Activity className="h-12 w-12 text-red-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">{t('Navbatda', language)}</p>
              <p className="text-3xl font-bold mt-2">{stats.totalPending || 0}</p>
            </div>
            <Clock className="h-12 w-12 text-yellow-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">{t('Faol Gateway', language)}</p>
              <p className="text-3xl font-bold mt-2">{stats.activeGateways || 0}</p>
            </div>
            <Smartphone className="h-12 w-12 text-blue-200" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex gap-4 px-6">
            <button
              onClick={() => setActiveTab('gateways')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'gateways'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Smartphone className="h-5 w-5 inline mr-2" />
              {t('Gateway\'lar', language)}
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'logs'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <MessageSquare className="h-5 w-5 inline mr-2" />
              {t('SMS Log\'lar', language)}
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'gateways' && (
            <div className="space-y-4">
              {gateways.length === 0 ? (
                <div className="text-center py-12">
                  <Smartphone className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">{t('Gateway\'lar topilmadi', language)}</p>
                </div>
              ) : (
                gateways.map((gateway: any) => (
                  <div
                    key={gateway._id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${isGatewayOnline(gateway.lastHeartbeat) ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div>
                        <h3 className="font-semibold text-gray-900">{gateway.name}</h3>
                        <p className="text-sm text-gray-500">
                          {gateway.simNumber || t('SIM raqam ko\'rsatilmagan', language)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Token: <code className="bg-gray-100 px-2 py-1 rounded">{gateway.token}</code>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {gateway.messagesSent} {t('ta SMS', language)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {gateway.lastHeartbeat
                            ? formatDate(gateway.lastHeartbeat)
                            : t('Hech qachon faol bo\'lmagan', language)}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm(t('Gateway\'ni o\'chirmoqchimisiz?', language))) {
                            deleteGatewayMutation.mutate(gateway._id);
                          }
                        }}
                        className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="overflow-x-auto">
              {logsLoading ? (
                <LoadingSpinner />
              ) : logs.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">{t('SMS log\'lar topilmadi', language)}</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {t('Telefon', language)}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {t('Xabar', language)}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {t('Status', language)}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {t('Vaqt', language)}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {logs.map((log: any) => (
                      <tr key={log._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {log.phoneNumber}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-md truncate">
                          {log.message}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(log.status)}`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(log.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Gateway Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => setIsCreateModalOpen(false)}
            ></div>

            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Smartphone className="h-6 w-6" />
                  {t('Yangi Gateway yaratish', language)}
                </h3>
              </div>

              <div className="px-6 py-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('Gateway nomi', language)} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newGateway.name}
                    onChange={(e) => setNewGateway({ ...newGateway, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('Mening telefonim', language)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('SIM raqami', language)} ({t('ixtiyoriy', language)})
                  </label>
                  <input
                    type="tel"
                    value={newGateway.simNumber}
                    onChange={(e) => setNewGateway({ ...newGateway, simNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+998 90 123 45 67"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    {t('Bekor qilish', language)}
                  </button>
                  <button
                    onClick={handleCreateGateway}
                    disabled={createGatewayMutation.isPending}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium disabled:opacity-50"
                  >
                    {createGatewayMutation.isPending ? t('Saqlanmoqda...', language) : t('Yaratish', language)}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmsGateway;

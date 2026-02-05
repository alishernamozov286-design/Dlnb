import axios from 'axios';
import API_CONFIG from '@/config/api.config';

const API_BASE_URL = API_CONFIG.BASE_URL;

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors and network changes
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    
    // ERR_NETWORK_CHANGED - network o'zgarganda retry qilish
    if (error.message?.includes('ERR_NETWORK_CHANGED') || 
        error.message?.includes('network change') ||
        error.code === 'ERR_NETWORK_CHANGED') {
      // Agar retry qilinmagan bo'lsa, 2 marta retry qilish
      if (!config._retryCount) {
        config._retryCount = 0;
      }
      
      if (config._retryCount < 2) {
        config._retryCount++;
        
        // Tezroq kutish: 500ms, 1000ms
        const delay = 500 * config._retryCount;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        console.log(`🔄 Retry ${config._retryCount}/2 after ERR_NETWORK_CHANGED: ${config.url}`);
        
        return api.request(config);
      } else {
        console.error(`❌ Failed after 2 retries (ERR_NETWORK_CHANGED): ${config.url}`);
      }
    }
    
    // Timeout yoki network xatoliklari uchun maxsus handling
    if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK' || error.message?.includes('timeout')) {
      // Network manager already handles status updates automatically
      
      return Promise.reject(error);
    }
    
    // Offline rejimda 401 error bo'lmasligi kerak
    if (!navigator.onLine) {
      return Promise.reject(error);
    }
    
    // Online rejimda 401 error bo'lsa, login ga yo'naltirish
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Helper function to get full image URL
export const getImageUrl = (imagePath: string | undefined): string => {
  if (!imagePath) return '';
  
  // Agar to'liq URL bo'lsa, o'zini qaytarish
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // API URL'dan /api qismini olib tashlash
  const baseUrl = API_BASE_URL.replace('/api', '');
  
  // Agar imagePath / bilan boshlanmasa, qo'shish
  const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  
  return `${baseUrl}${path}`;
};

// AI Diagnostic API
export const aiApi = {
  getDiagnosticAdvice: async (data: { problem: string; carModel?: string }) => {
    const response = await api.post('/ai/diagnostic', data);
    return response.data;
  }
};

// Chat API
export const chatApi = {
  sendMessage: async (data: { message: string; sessionId: string; language?: 'latin' | 'cyrillic' }) => {
    const response = await api.post('/chat/message', data);
    return response.data;
  },
  
  getHistory: async (sessionId: string, limit?: number) => {
    const response = await api.get(`/chat/history/${sessionId}`, {
      params: { limit }
    });
    return response.data;
  },
  
  clearHistory: async (sessionId: string) => {
    const response = await api.delete(`/chat/history/${sessionId}`);
    return response.data;
  },
  
  getSubscription: async () => {
    const response = await api.get('/chat/subscription');
    return response.data;
  }
};

// Car API
export const carApi = {
  completeCar: async (carId: string, notes?: string) => {
    const response = await api.post(`/cars/${carId}/complete`, { notes });
    return response.data;
  }
};

// Transaction API
export const transactionApi = {
  resetMonthlyEarnings: async () => {
    const response = await api.post('/transactions/reset-monthly');
    return response.data;
  },
  getMonthlyHistory: async (limit?: number) => {
    const response = await api.get('/transactions/monthly-history', {
      params: { limit }
    });
    return response.data;
  },
  getMonthHistory: async (year: number, month: number) => {
    const response = await api.get(`/transactions/monthly-history/${year}/${month}`);
    return response.data;
  },
  deleteMonthlyHistory: async (id: string) => {
    const response = await api.delete(`/transactions/monthly-history/${id}`);
    return response.data;
  }
};

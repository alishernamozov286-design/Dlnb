// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || '/api',
  TIMEOUT: 30000, // 30 sekund - network o'zgarishi uchun yetarli
  GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
} as const;

// Get server base URL for static assets
export const getServerBaseUrl = (): string => {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  // Remove /api suffix to get base URL
  return apiUrl.replace(/\/api$/, '');
};

export default API_CONFIG;

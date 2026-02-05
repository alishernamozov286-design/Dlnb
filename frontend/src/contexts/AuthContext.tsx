import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/types';
import { getStoredUser, getStoredToken, setAuthData, clearAuthData } from '@/lib/auth';
import api from '@/lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (usernameOrEmail: string, password: string, phone?: string) => Promise<void>;
  register: (name: string, email: string, username: string, password: string, role: 'master' | 'apprentice') => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = getStoredUser();
    const storedToken = getStoredToken();
    
    if (storedUser && storedToken) {
      setUser(storedUser);
      setToken(storedToken);
    }
    
    setIsLoading(false);
  }, []);

  const login = async (usernameOrEmail: string, password: string, phone?: string) => {
    try {
      let loginData: any;
      
      // Agar telefon raqam berilgan bo'lsa (shogirt)
      if (phone) {
        loginData = { 
          username: usernameOrEmail,  // Username
          phone: phone                 // Telefon raqam
        };
      } else {
        // Username yoki email ekanligini aniqlash (ustoz)
        const isEmail = usernameOrEmail.includes('@');
        loginData = isEmail 
          ? { email: usernameOrEmail, password }
          : { username: usernameOrEmail, password };
      }

      const response = await api.post('/auth/login', loginData);
      const { user: userData, token: userToken } = response.data;
      
      setUser(userData);
      setToken(userToken);
      setAuthData(userData, userToken);
    } catch (error: any) {
      console.error('Login error:', error.response?.data); // Debug
      throw new Error(error.response?.data?.message || 'Kirish muvaffaqiyatsiz');
    }
  };

  const register = async (name: string, email: string, username: string, password: string, role: 'master' | 'apprentice') => {
    try {
      const response = await api.post('/auth/register', { name, email, username, password, role });
      const { user: userData, token: userToken } = response.data;
      
      setUser(userData);
      setToken(userToken);
      setAuthData(userData, userToken);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Ro\'yxatdan o\'tish muvaffaqiyatsiz');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    clearAuthData();
  };

  const refreshUser = async () => {
    try {
      if (token) {
        const response = await api.get('/auth/me');
        const userData = response.data.user;
        setUser(userData);
        setAuthData(userData, token);
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    refreshUser,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
import { User } from '@/types';

export const getStoredUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const getStoredToken = (): string | null => {
  return localStorage.getItem('token');
};

export const setAuthData = (user: User, token: string) => {
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('token', token);
};

export const clearAuthData = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
};

export const isAuthenticated = (): boolean => {
  return !!(getStoredToken() && getStoredUser());
};
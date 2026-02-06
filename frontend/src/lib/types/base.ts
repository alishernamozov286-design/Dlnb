/**
 * Base Types - Umumiy type definitionlar
 */

export interface BaseEntity {
  _id: string;
  createdAt: string;
  updatedAt: string;
  _pending?: boolean;
  _lastModified?: number;
}

export interface RepositoryConfig {
  collection: string;
  singularName: string;
  useSoftDelete?: boolean;
  validation?: {
    required: string[];
    optional: string[];
  };
}

export interface SyncOperation {
  id?: number;
  collection: string;
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retryCount?: number;
}

export interface NetworkStatus {
  isOnline: boolean;
  isChecking: boolean;
  lastChecked: Date;
  backendHealthy: boolean;
  internetConnected: boolean;
}

export interface SyncResult {
  success: number;
  failed: number;
  errors: string[];
  timestamp?: number;
}

// Car specific types
export interface Car extends BaseEntity {
  make: string;
  carModel: string;
  year: number;
  licensePlate: string;
  ownerName: string;
  ownerPhone: string;
  status: 'pending' | 'in-progress' | 'completed' | 'delivered';
  paymentStatus: 'pending' | 'partial' | 'paid';
  totalEstimate: number;
  paidAmount: number;
  parts: CarPart[];
  serviceItems: ServiceItem[];
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface CarPart {
  _id?: string;
  name: string;
  quantity: number;
  price: number;
  status: 'needed' | 'ordered' | 'available' | 'installed';
}

export interface ServiceItem {
  _id?: string;
  name: string;
  description?: string;
  quantity: number;
  price: number;
  category: 'part' | 'material' | 'labor';
}

// Debt specific types
export interface Debt extends BaseEntity {
  clientName: string;
  clientPhone: string;
  amount: number;
  description: string;
  dueDate: string;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  paidAmount: number;
  remainingAmount: number;
  type: 'service' | 'part' | 'other';
}

// User specific types
export interface User extends BaseEntity {
  name: string;
  username: string;
  role: 'master' | 'apprentice';
  percentage?: number;
  profileImage?: string;
  isActive?: boolean;
}

// User specific types
export interface User extends BaseEntity {
  name: string;
  username: string;
  role: 'master' | 'apprentice';
  percentage?: number;
  phone?: string;
  email?: string;
  isActive?: boolean;
}
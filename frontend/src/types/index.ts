export interface User {
  _id: string;
  id: string;
  name: string;
  email: string;
  username: string;
  phone?: string; // Telefon raqam
  percentage?: number; // Shogird foizi
  role: 'master' | 'apprentice';
  earnings?: number; // Joriy oylik daromad
  totalEarnings?: number; // Jami daromad (barcha vaqt davomida)
  profileImage?: string;
  profession?: string;
  experience?: number;
  createdAt: string;
  updatedAt: string;
  stats?: ApprenticeStats;
}

// Transaction Types
export interface Transaction {
  _id: string;
  type: 'income' | 'expense';
  category: string;
  categoryId?: string; // Xarajat kategoriyasi ID'si
  amount: number;
  description: string;
  paymentMethod: 'cash' | 'card' | 'click';
  apprenticeId?: string; // Shogird ID'si (maosh to'lash uchun)
  sparePartName?: string; // Zapchast nomi (qarz yaratish uchun)
  relatedTo?: {
    type: 'debt' | 'car' | 'task' | 'expense_category' | 'other';
    id: string | null;
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionFilters {
  type?: 'income' | 'expense';
  category?: string;
  categoryId?: string; // Xarajat kategoriyasi ID'si
  paymentMethod?: 'cash' | 'card' | 'click';
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  incomeCount: number;
  expenseCount: number;
  incomeCash: number;
  incomeCard: number;
  expenseCash: number;
  expenseCard: number;
  balanceCash: number;
  balanceCard: number;
  todayIncome?: number;
  todayExpense?: number;
  todayBalance?: number;
  weekIncome?: number;
  weekExpense?: number;
  monthIncome?: number;
  monthExpense?: number;
}

export interface TransactionResponse {
  transactions: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface TransactionStats {
  byCategory: Array<{
    category: string;
    amount: number;
    count: number;
    percentage: number;
  }>;
  byPaymentMethod: Array<{
    method: 'cash' | 'card' | 'click';
    amount: number;
    count: number;
    percentage: number;
  }>;
  byDate: Array<{
    date: string;
    income: number;
    expense: number;
    balance: number;
  }>;
}

export interface DateRange {
  startDate?: string;
  endDate?: string;
}

export type DateFilterType = 'today' | 'week' | 'month' | 'all';
export type TransactionFilterType = 'all' | 'income' | 'expense';

export interface SparePart {
  _id: string;
  name: string;
  costPrice: number;
  sellingPrice: number;
  price: number; // Deprecated but kept for backward compatibility
  quantity: number;
  supplier: string;
  usageCount: number;
  isActive: boolean;
  profit: number; // Virtual field from backend
  createdAt: string;
  updatedAt: string;
}

export interface SparePartFilters {
  search?: string;
  page?: number;
  limit?: number;
  lowStock?: boolean;
}

export interface SparePartPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface SparePartResponse {
  spareParts: SparePart[];
  pagination: SparePartPagination;
  statistics?: {
    totalItems: number;
    totalQuantity: number;
    totalValue: number;
    totalProfit: number;
    lowStockCount: number;
  };
}

export interface ClientPart {
  carId: string;
  part: {
    _id: string;
    name: string;
    price: number;
    quantity: number;
    status: 'needed' | 'ordered' | 'received' | 'installed';
    source: 'available' | 'tobring';
  };
  carInfo: {
    _id: string;
    make: string;
    model: string;
    licensePlate: string;
    ownerName: string;
    ownerPhone: string;
    status: string;
  };
}

export interface ApprenticeStats {
  totalTasks: number;
  completedTasks: number;
  approvedTasks: number;
  inProgressTasks: number;
  assignedTasks: number;
  rejectedTasks: number;
  performance: number;
  awards: number;
}

export interface ServiceItem {
  _id?: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  category: 'part' | 'material' | 'labor';
}

export interface Car {
  _id: string;
  make: string;
  carModel: string;
  year: number;
  licensePlate: string;
  ownerName: string;
  ownerPhone: string;
  parts: Part[];
  serviceItems: ServiceItem[];
  totalEstimate: number;
  paidAmount?: number;
  paymentStatus?: 'pending' | 'partial' | 'paid';
  status: 'pending' | 'in-progress' | 'completed' | 'delivered';
  isDeleted?: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface Part {
  _id?: string;
  name: string;
  price: number;
  quantity: number;
  status: 'needed' | 'ordered' | 'available' | 'installed';
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  assignedTo: User;
  assignedBy: User;
  car: Car;
  service?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'assigned' | 'in-progress' | 'completed' | 'approved' | 'rejected';
  dueDate: string;
  completedAt?: string;
  approvedAt?: string;
  notes?: string;
  rejectionReason?: string;
  estimatedHours: number;
  actualHours?: number;
  payment?: number;
  apprenticeEarning?: number;
  assignments?: Array<{
    apprentice: User;
    earning: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ServicePart {
  _id?: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  isRequired: boolean;
  category: 'part' | 'material' | 'labor';
}

export interface Service {
  _id: string;
  name: string;
  description: string;
  basePrice: number;
  category: string;
  estimatedHours: number;
  parts: ServicePart[];
  totalPrice: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Debt {
  _id: string;
  type: 'receivable' | 'payable';
  amount: number;
  description: string;
  creditorName: string;
  creditorPhone?: string;
  car?: Car;
  dueDate?: string;
  status: 'pending' | 'partial' | 'paid';
  paidAmount: number;
  paymentHistory: Payment[];
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  amount: number;
  date: string;
  notes?: string;
}

export interface TaskStats {
  stats: Array<{
    _id: string;
    count: number;
    totalEstimatedHours: number;
    totalActualHours: number;
  }>;
  totalTasks: number;
}

export interface DebtSummary {
  receivables: {
    total: number;
    paid: number;
    remaining: number;
    count: number;
  };
  payables: {
    total: number;
    paid: number;
    remaining: number;
    count: number;
  };
  netPosition: number;
}
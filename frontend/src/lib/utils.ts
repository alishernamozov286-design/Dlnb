import { clsx, type ClassValue } from 'clsx';
import { format, formatDistanceToNow } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: string | Date) {
  return format(new Date(date), 'MMM dd, yyyy');
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), 'MMM dd, yyyy HH:mm');
}

export function formatRelativeTime(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

// Xavfsiz date formatting funksiyalari
export function safeFormatDate(date: string | Date | null | undefined, formatStr: string = 'dd.MM.yyyy'): string {
  if (!date) return 'Noma\'lum';
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return 'Noma\'lum';
    }
    return format(dateObj, formatStr);
  } catch (error) {
    console.warn('Date formatting error:', error);
    return 'Noma\'lum';
  }
}

export function safeFormatDateTime(date: string | Date | null | undefined): string {
  return safeFormatDate(date, 'dd.MM.yyyy HH:mm');
}

export function formatCurrency(amount: number, language?: 'latin' | 'cyrillic') {
  // Get language from parameter or localStorage
  const lang = language || localStorage.getItem('language') || 'latin';
  const currencyText = lang === 'cyrillic' ? 'сўм' : 'so\'m';
  
  return new Intl.NumberFormat('uz-UZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace(/,/g, '.') + ' ' + currencyText;
}

/**
 * Translate car status based on language
 * @param status - Car status from MongoDB
 * @param language - 'latin' or 'cyrillic'
 * @returns Translated status text
 */
export function translateStatus(status: string, language: 'latin' | 'cyrillic'): string {
  const translations: Record<string, { latin: string; cyrillic: string }> = {
    'pending': { latin: 'Kutilmoqda', cyrillic: 'Кутилмоқда' },
    'in-progress': { latin: 'Jarayonda', cyrillic: 'Жараёнда' },
    'completed': { latin: 'Tayyor', cyrillic: 'Тайёр' },
    'delivered': { latin: 'Topshirilgan', cyrillic: 'Топширилган' },
  };
  
  return translations[status]?.[language] || status;
}

/**
 * Translate payment status based on language
 * @param status - Payment status from MongoDB
 * @param language - 'latin' or 'cyrillic'
 * @returns Translated payment status text
 */
export function translatePaymentStatus(status: string, language: 'latin' | 'cyrillic'): string {
  const translations: Record<string, { latin: string; cyrillic: string }> = {
    'paid': { latin: 'To\'landi', cyrillic: 'Тўланди' },
    'partial': { latin: 'Qisman', cyrillic: 'Қисман' },
    'unpaid': { latin: 'To\'lanmagan', cyrillic: 'Тўланмаган' },
  };
  
  return translations[status]?.[language] || status;
}

// Pul miqdorini formatlash uchun yordamchi funksiya
export function formatNumber(value: string): string {
  // Faqat raqamlarni qoldirish
  const numbers = value.replace(/\D/g, '');
  
  // Agar bo'sh bo'lsa, bo'sh string qaytarish
  if (!numbers) return '';
  
  // Raqamlarni 3 ta guruhga bo'lib nuqta bilan ajratish
  return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Formatlanган stringni raqamga aylantirish
export function parseFormattedNumber(value: string): number {
  return parseInt(value.replace(/\./g, '')) || 0;
}

export function getPriorityColor(priority: string) {
  switch (priority) {
    case 'urgent':
      return 'badge-danger';
    case 'high':
      return 'badge-warning';
    case 'medium':
      return 'badge-primary';
    case 'low':
      return 'badge-gray';
    default:
      return 'badge-gray';
  }
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'completed':
    case 'approved':
    case 'paid':
    case 'delivered':
      return 'badge-success';
    case 'in-progress':
    case 'partial':
      return 'badge-warning';
    case 'assigned':
    case 'pending':
      return 'badge-primary';
    case 'rejected':
      return 'badge-danger';
    default:
      return 'badge-gray';
  }
}
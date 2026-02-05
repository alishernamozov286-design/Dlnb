/**
 * Telefon raqamini +998 XX XXX XX XX formatiga o'tkazadi
 */
export const formatPhoneNumber = (value: string): string => {
  // Faqat raqamlarni qoldirish
  const phoneNumber = value.replace(/\D/g, '');
  
  // Agar 998 bilan boshlanmasa, avtomatik qo'shish
  let formattedNumber = phoneNumber;
  if (!phoneNumber.startsWith('998') && phoneNumber.length > 0) {
    formattedNumber = '998' + phoneNumber;
  }
  
  // Maksimal 12 ta raqam (998 + 9 ta raqam)
  formattedNumber = formattedNumber.slice(0, 12);
  
  // Formatga o'tkazish: +998 XX XXX XX XX
  if (formattedNumber.length > 0) {
    let formatted = '+998';
    
    if (formattedNumber.length > 3) {
      formatted += ' ' + formattedNumber.slice(3, 5);
    }
    if (formattedNumber.length > 5) {
      formatted += ' ' + formattedNumber.slice(5, 8);
    }
    if (formattedNumber.length > 8) {
      formatted += ' ' + formattedNumber.slice(8, 10);
    }
    if (formattedNumber.length > 10) {
      formatted += ' ' + formattedNumber.slice(10, 12);
    }
    
    return formatted;
  }
  
  return '';
};

/**
 * Telefon raqamini validatsiya qiladi
 */
export const validatePhoneNumber = (phone: string): boolean => {
  const phoneDigits = phone.replace(/\D/g, '');
  return phoneDigits.length === 12 && phoneDigits.startsWith('998');
};

/**
 * Telefon raqamini faqat raqamlar ko'rinishida qaytaradi
 */
export const getPhoneDigits = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

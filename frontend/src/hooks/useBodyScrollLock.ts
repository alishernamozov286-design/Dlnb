import { useEffect } from 'react';

/**
 * Modal ochilganda body scroll ni bloklaydi
 */
export const useBodyScrollLock = (isOpen: boolean) => {
  useEffect(() => {
    if (isOpen) {
      // Scroll pozitsiyasini saqlash
      const scrollY = window.scrollY;
      
      // Body ga overflow hidden qo'shish
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      return () => {
        // Modal yopilganda asl holatga qaytarish
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        
        // Scroll pozitsiyasini qaytarish
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);
};

/**
 * ServicesRepository - Xizmatlar ma'lumotlarini boshqarish
 * Offline rejimda ham xizmatlarni ko'rish va tanlash imkoniyati
 */

import { BaseRepository } from './BaseRepository';

export interface Service {
  _id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
}

class ServicesRepository extends BaseRepository<Service> {
  constructor() {
    super('carServices', '/services');
  }

  /**
   * Online'dan xizmatlarni yuklab, offline uchun saqlash
   */
  async syncServices(): Promise<void> {
    try {
      const response = await this.api.get('/services');
      const services = response.data.services || [];
      
      // Barcha xizmatlarni saqlash
      for (const service of services) {
        await this.db.put(this.storeName, service);
      }
      
      console.log(`✅ ${services.length} ta xizmat saqlandi (offline uchun)`);
    } catch (error) {
      console.error('❌ Xizmatlarni sync qilishda xatolik:', error);
      throw error;
    }
  }

  /**
   * Kategoriya bo'yicha xizmatlarni olish
   */
  async getByCategory(category: string): Promise<Service[]> {
    const allServices = await this.getAll();
    return allServices.filter(service => service.category === category);
  }
}

export const servicesRepository = new ServicesRepository();

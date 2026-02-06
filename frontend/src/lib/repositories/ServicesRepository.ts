/**
 * ServicesRepository - Xizmatlar ma'lumotlarini boshqarish
 * Offline rejimda ham xizmatlarni ko'rish va tanlash imkoniyati
 */

import { BaseRepository } from './BaseRepository';
import { BaseEntity } from '../types/base';

export interface Service extends BaseEntity {
  name: string;
  description?: string;
  price: number;
  category?: string;
  isActive?: boolean;
  createdBy?: string;
}

class ServicesRepository extends BaseRepository<Service> {
  constructor() {
    super({
      collection: 'carServices',
      singularName: 'service',
      useSoftDelete: false
    });
  }

  protected validateCreate(data: Omit<Service, '_id'>): void {
    if (!data.name) throw new Error('Service name is required');
    if (data.price === undefined || data.price < 0) throw new Error('Valid price is required');
  }

  protected validateUpdate(data: Partial<Service>): void {
    if (data.price !== undefined && data.price < 0) {
      throw new Error('Price cannot be negative');
    }
  }

  protected getApiEndpoint(): string {
    return '/services';
  }

  protected transformForServer(data: any): any {
    const { _pending, _lastModified, ...cleanData } = data;
    return cleanData;
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

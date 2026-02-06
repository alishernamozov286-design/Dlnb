/**
 * UsersRepository - Shogirtlar ma'lumotlarini boshqarish
 * Offline rejimda ham shogirtlarni ko'rish va tanlash imkoniyati
 */

import { BaseRepository } from './BaseRepository';
import { User } from '../types/base';

class UsersRepository extends BaseRepository<User> {
  constructor() {
    super({
      collection: 'users',
      singularName: 'user',
      useSoftDelete: false
    });
  }

  protected validateCreate(data: Omit<User, '_id'>): void {
    if (!data.name) throw new Error('User name is required');
    if (!data.username) throw new Error('Username is required');
    if (!data.role) throw new Error('User role is required');
  }

  protected validateUpdate(_data: Partial<User>): void {
    // Basic validation for updates
  }

  protected getApiEndpoint(): string {
    return '/auth/users';
  }

  protected transformForServer(data: any): any {
    const { _pending, _lastModified, ...cleanData } = data;
    return cleanData;
  }

  /**
   * Faqat shogirtlarni olish
   */
  async getApprentices(): Promise<User[]> {
    const allUsers = await this.getAll();
    return allUsers.filter(user => user.role === 'apprentice');
  }

  /**
   * Online'dan shogirtlarni yuklab, offline uchun saqlash
   */
  async syncApprentices(): Promise<void> {
    try {
      const allUsers = await this.getAll();
      console.log(`✅ ${allUsers.length} ta user saqlandi (offline uchun)`);
    } catch (error) {
      console.error('❌ Userlarni sync qilishda xatolik:', error);
      throw error;
    }
  }
}

export const usersRepository = new UsersRepository();

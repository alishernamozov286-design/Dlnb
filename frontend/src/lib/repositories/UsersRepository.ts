/**
 * UsersRepository - Shogirtlar ma'lumotlarini boshqarish
 * Offline rejimda ham shogirtlarni ko'rish va tanlash imkoniyati
 */

import { BaseRepository } from './BaseRepository';
import { User } from '../types/base';

class UsersRepository extends BaseRepository<User> {
  constructor() {
    super('users', '/users');
  }

  /**
   * Faqat shogirtlarni olish
   */
  async getApprentices(): Promise<User[]> {
    const allUsers = await this.getAll();
    return allUsers.filter(user => user.role === 'apprentice');
  }

  /**
   * Shogirtni ID bo'yicha olish
   */
  async getApprenticeById(id: string): Promise<User | null> {
    return this.getById(id);
  }

  /**
   * Online'dan shogirtlarni yuklab, offline uchun saqlash
   */
  async syncApprentices(): Promise<void> {
    try {
      const response = await this.api.get('/users');
      const users = response.data.users || [];
      
      // Barcha userlarni saqlash
      for (const user of users) {
        await this.db.put(this.storeName, user);
      }
      
      console.log(`✅ ${users.length} ta user saqlandi (offline uchun)`);
    } catch (error) {
      console.error('❌ Userlarni sync qilishda xatolik:', error);
      throw error;
    }
  }
}

export const usersRepository = new UsersRepository();

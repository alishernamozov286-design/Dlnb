/**
 * IndexedDB Manager - Simplified Storage Operations
 * 
 * IndexedDB operatsiyalarini soddalashtiradi va markazlashtiradi
 */

import {
  saveToIndexedDB,
  getFromIndexedDB,
  getOneFromIndexedDB,
  deleteFromIndexedDB,
  replaceServerDataInIndexedDB
} from '@/lib/indexedDB';

export class IndexedDBManager {
  private static instance: IndexedDBManager;

  private constructor() {}

  static getInstance(): IndexedDBManager {
    if (!IndexedDBManager.instance) {
      IndexedDBManager.instance = new IndexedDBManager();
    }
    return IndexedDBManager.instance;
  }

  /**
   * Get all items from a collection
   */
  async getAll<T>(collection: string): Promise<T[]> {
    try {
      return await getFromIndexedDB<T>(collection as any);
    } catch (error) {
      console.error(`Failed to get ${collection} from IndexedDB:`, error);
      return [];
    }
  }

  /**
   * Get single item by ID
   */
  async getById<T>(collection: string, id: string): Promise<T | undefined> {
    try {
      return await getOneFromIndexedDB<T>(collection as any, id);
    } catch (error) {
      console.error(`Failed to get ${collection}/${id} from IndexedDB:`, error);
      return undefined;
    }
  }

  /**
   * Save items to IndexedDB
   */
  async save<T>(collection: string, items: T[]): Promise<void> {
    try {
      await saveToIndexedDB(collection as any, items);
    } catch (error) {
      console.error(`Failed to save to ${collection}:`, error);
      throw error;
    }
  }

  /**
   * Update single item
   */
  async update<T>(collection: string, id: string, item: T): Promise<void> {
    try {
      await saveToIndexedDB(collection as any, [item]);
    } catch (error) {
      console.error(`Failed to update ${collection}/${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete item by ID
   */
  async delete(collection: string, id: string): Promise<void> {
    try {
      await deleteFromIndexedDB(collection as any, id);
    } catch (error) {
      console.error(`Failed to delete ${collection}/${id}:`, error);
      throw error;
    }
  }

  /**
   * Replace server data (keeping pending items)
   */
  async replaceServerData<T extends { _id: string }>(
    collection: string,
    serverData: T[]
  ): Promise<void> {
    try {
      await replaceServerDataInIndexedDB(collection as any, serverData);
    } catch (error) {
      console.error(`Failed to replace ${collection}:`, error);
      throw error;
    }
  }
}

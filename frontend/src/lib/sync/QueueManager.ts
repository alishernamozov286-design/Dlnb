/**
 * Queue Manager - Pending Operations Management
 * 
 * Offline operatsiyalarni queue'da saqlaydi va sinxronlashni boshqaradi
 */

import { SyncOperation } from '@/lib/types/base';
import { getPendingSync, addPendingSync, clearPendingSync } from '@/lib/indexedDB';

export class QueueManager {
  private static instance: QueueManager;
  private isSyncing = false;

  private constructor() {}

  static getInstance(): QueueManager {
    if (!QueueManager.instance) {
      QueueManager.instance = new QueueManager();
    }
    return QueueManager.instance;
  }

  /**
   * Add operation to sync queue
   */
  async addOperation(
    collection: string,
    action: 'create' | 'update' | 'delete',
    data: any
  ): Promise<void> {
    try {
      await addPendingSync(collection as any, action, data);
    } catch (error) {
      console.error('Failed to add operation to queue:', error);
      throw error;
    }
  }

  /**
   * Get all pending operations
   */
  async getPendingOperations(): Promise<SyncOperation[]> {
    try {
      return await getPendingSync();
    } catch (error) {
      console.error('Failed to get pending operations:', error);
      return [];
    }
  }

  /**
   * Get pending operations count
   */
  async getPendingCount(): Promise<number> {
    try {
      const operations = await getPendingSync();
      return operations.length;
    } catch (error) {
      console.error('Failed to get pending count:', error);
      return 0;
    }
  }

  /**
   * Clear specific operation from queue
   */
  async clearOperation(operationId: number): Promise<void> {
    try {
      await clearPendingSync(operationId);
    } catch (error) {
      console.error('Failed to clear operation:', error);
      throw error;
    }
  }

  /**
   * Check if sync is in progress
   */
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  /**
   * Set sync status
   */
  setSyncStatus(status: boolean): void {
    this.isSyncing = status;
  }
}

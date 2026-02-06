/**
 * Sync Manager - Automatic Background Synchronization
 * 
 * Offline operatsiyalarni avtomatik ravishda server'ga yuboradi
 * Online bo'lganda queue'dagi barcha vazifalarni bajaradi va o'chiradi
 */

import { NetworkManager } from '@/lib/sync/NetworkManager';
import { QueueManager } from '@/lib/sync/QueueManager';
import { IndexedDBManager } from '@/lib/storage/IndexedDBManager';
import { SyncOperation, SyncResult } from '@/lib/types/base';
import { api } from '@/lib/api';

export class SyncManager {
  private static instance: SyncManager;
  private networkManager: NetworkManager;
  private queueManager: QueueManager;
  private storage: IndexedDBManager;
  private isSyncing = false;
  private syncListeners = new Set<(result: SyncResult) => void>();

  private constructor() {
    this.networkManager = NetworkManager.getInstance();
    this.queueManager = QueueManager.getInstance();
    this.storage = IndexedDBManager.getInstance();

    // Listen to network changes - INSTANT sync (0ms)
    this.networkManager.onStatusChange((status) => {
      if (status.isOnline && !this.isSyncing) {
        // INSTANT sync - kechikishsiz darhol boshlanadi
        this.syncPendingOperations();
      }
    });
  }

  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  /**
   * Sync all pending operations to server
   */
  async syncPendingOperations(): Promise<SyncResult> {
    if (this.isSyncing) {
      return { success: 0, failed: 0, errors: [] };
    }

    if (!this.networkManager.isOnline()) {
      return { success: 0, failed: 0, errors: ['Network offline'] };
    }

    this.isSyncing = true;
    this.queueManager.setSyncStatus(true);

    const result: SyncResult = {
      success: 0,
      failed: 0,
      errors: []
    };

    try {
      // Get all pending operations
      const operations = await this.queueManager.getPendingOperations();
      
      if (operations.length === 0) {
        return result;
      }

      // Sort operations: delete last, create/update first
      const sortedOps = this.sortOperations(operations);

      // OPTIMIZATION: Parallel sync - bir vaqtda 3 ta operatsiya
      const BATCH_SIZE = 3;
      
      for (let i = 0; i < sortedOps.length; i += BATCH_SIZE) {
        const batch = sortedOps.slice(i, i + BATCH_SIZE);
        
        // Parallel sync qilish
        const batchResults = await Promise.allSettled(
          batch.map(async (operation) => {
            try {
              await this.syncOperation(operation);
              await this.queueManager.clearOperation(operation.id!);
              return { success: true, operation };
            } catch (error: any) {
              return { success: false, operation, error };
            }
          })
        );
        
        // Natijalarni qayta ishlash
        for (const batchResult of batchResults) {
          if (batchResult.status === 'fulfilled') {
            const { success, operation, error } = batchResult.value;
            
            if (success) {
              result.success++;
            } else {
              // Xatolarni handle qilish
              await this.handleSyncError(operation, error, result);
            }
          } else {
            // Promise rejected
            result.failed++;
            result.errors.push(`Batch sync error: ${batchResult.reason}`);
          }
        }
        
        // Batch'lar orasida minimal pauza (20ms - ultra fast)
        if (i + BATCH_SIZE < sortedOps.length) {
          await new Promise(resolve => setTimeout(resolve, 20));
        }
      }

      // DARHOL notify listeners (UI yangilanishi uchun)
      this.notifyListeners(result);

      return result;
    } catch (error: any) {
      console.error('Sync process failed:', error);
      result.errors.push(`Sync process error: ${error.message}`);
      return result;
    } finally {
      this.isSyncing = false;
      this.queueManager.setSyncStatus(false);
    }
  }

  /**
   * Sync single operation to server
   */
  private async syncOperation(operation: SyncOperation): Promise<void> {
    const { collection, action, data } = operation;

    try {
      switch (action) {
        case 'create':
          await this.syncCreate(collection, data);
          break;
        
        case 'update':
          await this.syncUpdate(collection, data);
          break;
        
        case 'delete':
          await this.syncDelete(collection, data);
          break;
        
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error: any) {
      // 400 Bad Request - Validation xatolari (throw qilish, yuqorida handle qilinadi)
      if (error?.response?.status === 400) {
        throw error;
      }
      
      // ERR_NETWORK_CHANGED - network o'zgarganda INSTANT retry (50ms)
      if (error.message?.includes('ERR_NETWORK_CHANGED') || error.message?.includes('network changed')) {
        // 50ms kutib INSTANT retry
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Retry
        switch (action) {
          case 'create':
            await this.syncCreate(collection, data);
            break;
          
          case 'update':
            await this.syncUpdate(collection, data);
            break;
          
          case 'delete':
            await this.syncDelete(collection, data);
            break;
        }
      } else {
        throw error;
      }
    }
  }

  /**
   * Sync CREATE operation
   */
  private async syncCreate(collection: string, data: any): Promise<void> {
    const endpoint = this.getEndpoint(collection);
    const cleanData = this.cleanDataForServer(data);

    try {
      // Send to server
      const response = await api.post(endpoint, cleanData);
      const serverItem = response.data.data || response.data[this.getSingularName(collection)] || response.data;

      // Replace temp item with server item in IndexedDB
      if (data._id && data._id.startsWith('temp_')) {
        // Delete temp item
        await this.storage.delete(collection, data._id);
        
        // Save server item
        await this.storage.save(collection, [serverItem]);
        
        console.log(`✅ Temp item replaced with server item: ${data._id} -> ${serverItem._id}`);
      } else {
        // Just update with server data
        await this.storage.save(collection, [serverItem]);
      }
    } catch (error: any) {
      // 400 Bad Request - Validation xatolari
      if (error?.response?.status === 400) {
        const errorMessage = error?.response?.data?.message || error.message;
        console.error(`❌ Validation error creating ${collection}:`, errorMessage);
        
        // Agar temp ID bo'lsa, IndexedDB'dan o'chirish
        if (data._id && data._id.startsWith('temp_')) {
          console.warn(`⚠️ Removing temp item due to validation error: ${data._id}`);
          await this.storage.delete(collection, data._id);
        }
        
        throw error;
      }
      
      console.error(`Failed to create ${collection}:`, error);
      throw error;
    }
  }

  /**
   * Sync UPDATE operation
   */
  private async syncUpdate(collection: string, data: any): Promise<void> {
    // Skip temp IDs (they should be created first)
    if (data._id && data._id.startsWith('temp_')) {
      return;
    }

    const endpoint = this.getEndpoint(collection);
    const cleanData = this.cleanDataForServer(data);

    try {
      // Send to server
      const response = await api.put(`${endpoint}/${data._id}`, cleanData);
      const serverItem = response.data.data || response.data[this.getSingularName(collection)] || response.data;

      // Update in IndexedDB
      await this.storage.update(collection, data._id, serverItem);
    } catch (error: any) {
      console.error(`Failed to update ${collection}:`, error);
      throw error;
    }
  }

  /**
   * Sync DELETE operation
   */
  private async syncDelete(collection: string, data: any): Promise<void> {
    // Skip temp IDs (they don't exist on server)
    if (data._id && data._id.startsWith('temp_')) {
      return;
    }

    const endpoint = this.getEndpoint(collection);

    try {
      // Send to server
      await api.delete(`${endpoint}/${data._id}`);

      // Already deleted from IndexedDB, nothing to do
    } catch (error: any) {
      // If 404, item already deleted on server - that's OK
      if (error.response?.status === 404) {
        return;
      }
      
      console.error(`Failed to delete ${collection}:`, error);
      throw error;
    }
  }

  /**
   * Sort operations for proper execution order
   * CREATE/UPDATE first, DELETE last
   */
  private sortOperations(operations: SyncOperation[]): SyncOperation[] {
    return operations.sort((a, b) => {
      // Delete operations go last
      if (a.action === 'delete' && b.action !== 'delete') return 1;
      if (a.action !== 'delete' && b.action === 'delete') return -1;
      
      // Otherwise, sort by timestamp (oldest first)
      return a.timestamp - b.timestamp;
    });
  }

  /**
   * Handle sync error for a single operation
   */
  private async handleSyncError(operation: SyncOperation, error: any, result: SyncResult): Promise<void> {
    // 400 Bad Request - Validation xatolari (retry qilmaslik)
    if (error?.response?.status === 400) {
      const errorMessage = error?.response?.data?.message || error.message;
      
      // Duplicate licensePlate xatosi
      if (errorMessage.includes('allaqachon mavjud') || errorMessage.includes('already exists')) {
        console.warn(`⚠️ Duplicate data, removing from queue: ${operation.action} ${operation.collection}`, errorMessage);
        await this.queueManager.clearOperation(operation.id!);
        result.failed++;
        result.errors.push(`${operation.action} ${operation.collection}: ${errorMessage} (o'chirildi)`);
        return;
      }
      
      // Temp ID xatosi
      if (errorMessage.includes('Temp ID') || errorMessage.includes('temp_')) {
        console.warn(`⚠️ Temp ID error, removing from queue: ${operation.action} ${operation.collection}`);
        await this.queueManager.clearOperation(operation.id!);
        result.failed++;
        result.errors.push(`${operation.action} ${operation.collection}: Temp ID xatosi (o'chirildi)`);
        return;
      }
      
      // Boshqa validation xatolari - 3 marta retry
      if (!operation.retryCount) operation.retryCount = 0;
      operation.retryCount++;
      
      if (operation.retryCount >= 3) {
        console.error(`❌ Validation error after 3 retries, removing: ${operation.action} ${operation.collection}`, errorMessage);
        await this.queueManager.clearOperation(operation.id!);
        result.failed++;
        result.errors.push(`${operation.action} ${operation.collection}: ${errorMessage} (3 marta urinildi, o'chirildi)`);
      } else {
        result.failed++;
        result.errors.push(`${operation.action} ${operation.collection}: ${errorMessage} (retry ${operation.retryCount}/3)`);
      }
      return;
    }
    
    // ERR_NETWORK_CHANGED is normal when switching from offline to online
    if (error?.message?.includes('network change') || error?.code === 'ERR_NETWORK_CHANGED') {
      // Retry once after network change - INSTANT (50ms)
      await new Promise(resolve => setTimeout(resolve, 50));
      try {
        await this.syncOperation(operation);
        await this.queueManager.clearOperation(operation.id!);
        result.success++;
        return; // Skip error handling
      } catch (retryError: any) {
        result.failed++;
        result.errors.push(`${operation.action} ${operation.collection}: ${retryError.message}`);
        console.error(`Failed to sync after retry ${operation.action} ${operation.collection}:`, retryError);
      }
    } else {
      result.failed++;
      result.errors.push(`${operation.action} ${operation.collection}: ${error.message}`);
      console.error(`Failed to sync ${operation.action} ${operation.collection}:`, error);
    }
    
    // Retry count increment for other errors
    if (!operation.retryCount) operation.retryCount = 0;
    operation.retryCount++;
    
    // If too many retries, remove from queue
    if (operation.retryCount > 3) {
      console.error(`❌ Too many retries (${operation.retryCount}), removing from queue: ${operation.action} ${operation.collection}`);
      await this.queueManager.clearOperation(operation.id!);
    }
  }

  /**
   * Clean data before sending to server
   */
  private cleanDataForServer(data: any): any {
    const cleanData = { ...data };

    // Remove client-side fields
    delete cleanData._id;
    delete cleanData._pending;
    delete cleanData._lastModified;
    delete cleanData.createdAt;
    delete cleanData.updatedAt;
    delete cleanData.__v;
    delete cleanData.isDeleted;
    delete cleanData.deletedAt;

    return cleanData;
  }

  /**
   * Get API endpoint for collection
   */
  private getEndpoint(collection: string): string {
    const endpoints: Record<string, string> = {
      cars: '/cars',
      debts: '/debts',
      tasks: '/tasks',
      services: '/services',
      spareParts: '/spare-parts'
    };

    return endpoints[collection] || `/${collection}`;
  }

  /**
   * Get singular name for collection
   */
  private getSingularName(collection: string): string {
    const singularNames: Record<string, string> = {
      cars: 'car',
      debts: 'debt',
      tasks: 'task',
      services: 'service',
      spareParts: 'sparePart'
    };

    return singularNames[collection] || collection.slice(0, -1);
  }

  /**
   * Listen to sync results
   */
  onSyncComplete(callback: (result: SyncResult) => void): () => void {
    this.syncListeners.add(callback);
    return () => this.syncListeners.delete(callback);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(result: SyncResult): void {
    this.syncListeners.forEach(callback => {
      try {
        callback(result);
      } catch (error) {
        console.error('Sync listener error:', error);
      }
    });
  }

  /**
   * Check if sync is in progress
   */
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  /**
   * Force sync now (manual trigger)
   */
  async forceSyncNow(): Promise<SyncResult> {
    return await this.syncPendingOperations();
  }
}

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

    // Listen to network changes - DARHOL sync qilish
    this.networkManager.onStatusChange((status) => {
      if (status.isOnline && !this.isSyncing) {
        // Darhol sync qilish (kechikmasdan)
        setTimeout(() => {
          this.syncPendingOperations();
        }, 100); // 100ms kechikish (network stabilize bo'lishi uchun)
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

      // Process each operation
      for (const operation of sortedOps) {
        try {
          await this.syncOperation(operation);
          
          // ✅ SUCCESS: O'chirish - vazifa bajarildi
          await this.queueManager.clearOperation(operation.id!);
          result.success++;
        } catch (error: any) {
          // ERR_NETWORK_CHANGED is normal when switching from offline to online
          if (error?.message?.includes('network change') || error?.code === 'ERR_NETWORK_CHANGED') {
            // Retry once after network change
            await new Promise(resolve => setTimeout(resolve, 500));
            try {
              await this.syncOperation(operation);
              await this.queueManager.clearOperation(operation.id!);
              result.success++;
              continue; // Skip error handling
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
          
          // Retry count increment
          if (operation.retryCount !== undefined) {
            operation.retryCount++;
            
            // If too many retries, remove from queue
            if (operation.retryCount > 5) {
              await this.queueManager.clearOperation(operation.id!);
            }
          }
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
      // ERR_NETWORK_CHANGED - network o'zgarganda retry qilish
      if (error.message?.includes('ERR_NETWORK_CHANGED') || error.message?.includes('network changed')) {
        // 1 sekund kutib retry qilish
        await new Promise(resolve => setTimeout(resolve, 1000));
        
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
      } else {
        // Just update with server data
        await this.storage.save(collection, [serverItem]);
      }
    } catch (error: any) {
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

// Global type declarations for window object extensions

declare global {
  interface Window {
    offlineSync?: {
      getOnlineStatus(): boolean;
      updateConnectionStatus(isOnline: boolean): void;
      syncWithServer(): Promise<void>;
      debugPendingOperations(): Promise<any[]>;
      clearAllPendingOperations(): Promise<boolean>;
      forceSyncNow(): Promise<{ success: number; failed: number }>;
      addPendingOperation(collection: string, action: string, data: any): Promise<void>;
      createData(collection: string, data: any): Promise<any>;
      updateData(collection: string, id: string, data: any): Promise<any>;
      deleteData(collection: string, id: string): Promise<void>;
      getData(collection: string): Promise<any[]>;
      getPendingSyncCount(): Promise<number>;
    };
    getFromIndexedDB?: (collection: string) => Promise<any[]>;
    getPendingSync?: () => Promise<any[]>;
    api?: {
      get(url: string): Promise<any>;
      post(url: string, data: any): Promise<any>;
      put(url: string, data: any): Promise<any>;
      delete(url: string): Promise<any>;
    };
    debugOfflineDeleteSync?: {
      compareData(): Promise<any>;
      showPendingOperations(): Promise<any[]>;
      testSync(): Promise<void>;
      fullDeleteTest(): Promise<void>;
      findProblematicData(): Promise<any>;
      manualSync(): Promise<any>;
    };
    debugOfflineSync?: {
      status(): Promise<{ isOnline: boolean; carsCount: number; pendingCount: number }>;
      syncNow(): Promise<{ success: number; failed: number }>;
      testComplete(): Promise<{ success: boolean; message: string; [key: string]: any }>;
      checkPending?(): Promise<any[]>;
      clearPending?(): Promise<boolean>;
      getStatus?(): Promise<{ isOnline: boolean; pendingCount: number }>;
      [key: string]: any;
    };
    testCompleteOfflineSync?: () => Promise<{ success: boolean; message: string; [key: string]: any }>;
    testOfflineDelete?: (carId: string) => Promise<{ success: boolean; message: string; [key: string]: any }>;
  }
}

export {};
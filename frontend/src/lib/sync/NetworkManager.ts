/**
 * Network Manager - Reliable Network Detection
 * 
 * Bitta joyda network holatini boshqaradi
 * Race condition va inconsistent state muammolarini hal qiladi
 */

import { NetworkStatus } from '../types/base';

export class NetworkManager {
  private static instance: NetworkManager;
  private status: NetworkStatus;
  private listeners = new Set<(status: NetworkStatus) => void>();
  private checkInterval: NodeJS.Timeout | null = null;
  private isChecking = false;

  private constructor() {
    // Quick initial status based on browser
    const browserOnline = navigator.onLine;
    
    this.status = {
      isOnline: browserOnline, // Start with browser status
      isChecking: browserOnline, // Only check if browser says online
      lastChecked: new Date(),
      backendHealthy: false,
      internetConnected: browserOnline
    };

    this.setupEventListeners();
    this.startPeriodicCheck();
    
    // Initial check only if browser says online
    if (browserOnline) {
      this.checkNetworkStatus();
    }
  }

  static getInstance(): NetworkManager {
    if (!NetworkManager.instance) {
      NetworkManager.instance = new NetworkManager();
    }
    return NetworkManager.instance;
  }

  public getStatus(): NetworkStatus {
    return { ...this.status };
  }

  public isOnline(): boolean {
    return this.status.isOnline;
  }

  public isBackendHealthy(): boolean {
    return this.status.backendHealthy;
  }

  public hasInternetConnection(): boolean {
    return this.status.internetConnected;
  }

  public onStatusChange(callback: (status: NetworkStatus) => void): () => void {
    this.listeners.add(callback);
    
    // Immediately call with current status
    callback(this.getStatus());
    
    return () => this.listeners.delete(callback);
  }

  public async forceCheck(): Promise<NetworkStatus> {
    await this.checkNetworkStatus();
    return this.getStatus();
  }

  private setupEventListeners(): void {
    // Browser online/offline events
    window.addEventListener('online', () => {
      this.checkNetworkStatus();
    });

    window.addEventListener('offline', () => {
      this.updateStatus({
        isOnline: false,
        internetConnected: false,
        backendHealthy: false
      });
    });

    // REMOVED: visibilitychange and focus events to prevent frequent refreshes
    // Network status will be checked only on:
    // - Browser online/offline events
    // - Manual forceCheck() calls
  }

  private startPeriodicCheck(): void {
    // DISABLED: Periodic check removed to prevent unnecessary refreshes
    // Network status will be checked only on:
    // - Browser online/offline events
    // - Tab visibility change
    // - Window focus
    // - Manual forceCheck() calls
  }

  private async checkNetworkStatus(): Promise<void> {
    if (this.isChecking) {
      return;
    }

    this.isChecking = true;
    this.updateStatus({ isChecking: true });

    try {
      // Step 1: Check browser online status
      const browserOnline = navigator.onLine;

      if (!browserOnline) {
        // FAST: Immediately set offline status without checking internet/backend
        this.updateStatus({
          isOnline: false,
          internetConnected: false,
          backendHealthy: false,
          isChecking: false,
          lastChecked: new Date()
        });
        this.isChecking = false;
        return;
      }

      // Step 2: Check internet connectivity
      const internetConnected = await this.checkInternetConnection();

      if (!internetConnected) {
        this.updateStatus({
          isOnline: false,
          internetConnected: false,
          backendHealthy: false,
          isChecking: false,
          lastChecked: new Date()
        });
        this.isChecking = false;
        return;
      }

      // Step 3: Check backend health
      const backendHealthy = await this.checkBackendHealth();

      // Final status
      const isOnline = browserOnline && internetConnected && backendHealthy;
      
      this.updateStatus({
        isOnline,
        internetConnected,
        backendHealthy,
        isChecking: false,
        lastChecked: new Date()
      });

    } catch (error) {
      console.error('Network check failed:', error);
      
      this.updateStatus({
        isOnline: false,
        internetConnected: false,
        backendHealthy: false,
        isChecking: false,
        lastChecked: new Date()
      });
    } finally {
      this.isChecking = false;
    }
  }

  private async checkInternetConnection(): Promise<boolean> {
    try {
      // Try to fetch a small resource from a reliable external source
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 seconds instead of 5

      await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal,
        cache: 'no-cache'
      });

      clearTimeout(timeoutId);
      return true;
    } catch (error: any) {
      // ERR_NETWORK_CHANGED is normal when switching from offline to online
      if (error?.message?.includes('network change') || error?.message?.includes('NetworkError')) {
        return true; // Assume online if network changed
      }
      return false;
    }
  }

  private async checkBackendHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 seconds instead of 8

      const response = await fetch('/api/health', {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      clearTimeout(timeoutId);
      
      // Accept 200 (healthy) or 401 (unauthorized but server is running)
      return response.status === 200 || response.status === 401;
    } catch (error: any) {
      // ERR_NETWORK_CHANGED is normal when switching from offline to online
      if (error?.message?.includes('network change') || error?.message?.includes('NetworkError')) {
        // Retry once after network change
        await new Promise(resolve => setTimeout(resolve, 500));
        try {
          const response = await fetch('/api/health', {
            method: 'GET',
            cache: 'no-cache'
          });
          return response.status === 200 || response.status === 401;
        } catch {
          return false;
        }
      }
      return false;
    }
  }

  private updateStatus(updates: Partial<NetworkStatus>): void {
    const oldStatus = { ...this.status };
    this.status = { ...this.status, ...updates };

    // Only notify if status actually changed
    if (this.hasStatusChanged(oldStatus, this.status)) {
      // Notify all listeners
      this.listeners.forEach(callback => {
        try {
          callback(this.getStatus());
        } catch (error) {
          console.error('Network status listener error:', error);
        }
      });
    }
  }

  private hasStatusChanged(oldStatus: NetworkStatus, newStatus: NetworkStatus): boolean {
    // Only notify on meaningful status changes, ignore isChecking changes
    return (
      oldStatus.isOnline !== newStatus.isOnline ||
      oldStatus.internetConnected !== newStatus.internetConnected ||
      oldStatus.backendHealthy !== newStatus.backendHealthy
      // REMOVED: isChecking - to prevent frequent listener triggers
    );
  }

  public destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    this.listeners.clear();
    
    window.removeEventListener('online', this.checkNetworkStatus);
    window.removeEventListener('offline', this.checkNetworkStatus);
    document.removeEventListener('visibilitychange', this.checkNetworkStatus);
    window.removeEventListener('focus', this.checkNetworkStatus);
  }
}

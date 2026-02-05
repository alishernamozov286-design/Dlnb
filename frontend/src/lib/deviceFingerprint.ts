export interface DeviceInfo {
  userAgent: string;
  platform: string;
  language: string;
  screenResolution: string;
  timezone: string;
}

export class DeviceFingerprint {
  /**
   * Collect device information for fingerprinting
   */
  static collectDeviceInfo(): DeviceInfo {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  /**
   * Get stored device ID from localStorage
   * If not exists, generate and store new one
   */
  static getOrCreateDeviceId(): string {
    const STORAGE_KEY = 'mator_device_id';
    
    let deviceId = localStorage.getItem(STORAGE_KEY);
    
    if (!deviceId) {
      deviceId = this.generateDeviceId();
      localStorage.setItem(STORAGE_KEY, deviceId);
    }
    
    return deviceId;
  }

  /**
   * Generate random device ID
   */
  private static generateDeviceId(): string {
    return 'dev_' + Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15) +
           Date.now().toString(36);
  }

  /**
   * Clear device ID (for testing)
   */
  static clearDeviceId(): void {
    localStorage.removeItem('mator_device_id');
  }
}

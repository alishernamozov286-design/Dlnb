import crypto from 'crypto';

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  language: string;
  screenResolution: string;
  timezone: string;
}

export class DeviceFingerprintService {
  /**
   * Generate unique device fingerprint
   * Combines multiple device characteristics to create unique hash
   */
  static generateFingerprint(deviceInfo: DeviceInfo, userId: string): string {
    const {
      userAgent,
      platform,
      language,
      screenResolution,
      timezone
    } = deviceInfo;

    // Combine all device characteristics
    const fingerprintString = [
      userId,
      userAgent,
      platform,
      language,
      screenResolution,
      timezone
    ].join('|');

    // Create SHA-256 hash
    return crypto
      .createHash('sha256')
      .update(fingerprintString)
      .digest('hex');
  }

  /**
   * Generate device ID from browser/device info
   */
  static generateDeviceId(deviceInfo: DeviceInfo): string {
    const { userAgent, platform } = deviceInfo;
    
    const deviceString = [userAgent, platform].join('|');
    
    return crypto
      .createHash('md5')
      .update(deviceString)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Validate device info completeness
   */
  static validateDeviceInfo(deviceInfo: any): deviceInfo is DeviceInfo {
    return (
      typeof deviceInfo === 'object' &&
      typeof deviceInfo.userAgent === 'string' &&
      typeof deviceInfo.platform === 'string' &&
      typeof deviceInfo.language === 'string' &&
      typeof deviceInfo.screenResolution === 'string' &&
      typeof deviceInfo.timezone === 'string'
    );
  }
}

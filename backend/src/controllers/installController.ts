import { Request, Response } from 'express';
import DeviceInstall from '../models/DeviceInstall';
import { DeviceFingerprintService, DeviceInfo } from '../services/deviceFingerprintService';
const MAX_INSTALL_LIMIT = 5;
/**
 * Check if device can install the app
 * POST /api/install/check
 */
export const checkInstallEligibility = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { deviceInfo } = req.body;
    // Validate device info
    if (!DeviceFingerprintService.validateDeviceInfo(deviceInfo)) {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri qurilma ma\'lumotlari'
      });
    }
    // Generate device identifiers
    const deviceId = DeviceFingerprintService.generateDeviceId(deviceInfo);
    const deviceFingerprint = DeviceFingerprintService.generateFingerprint(deviceInfo, userId);
    // Check existing device install record
    let deviceInstall = await DeviceInstall.findOne({
      userId,
      deviceFingerprint
    });
    // If device not found, check by deviceId (less strict)
    if (!deviceInstall) {
      deviceInstall = await DeviceInstall.findOne({
        userId,
        deviceId
      });
    }
    // New device - allow install
    if (!deviceInstall) {
      return res.json({
        success: true,
        canInstall: true,
        installCount: 0,
        remainingInstalls: MAX_INSTALL_LIMIT,
        message: 'Ilovani o\'rnatishingiz mumkin'
      });
    }
    // Check if device can install
    const canInstall = (deviceInstall as any).canInstall();
    if (!canInstall) {
      return res.status(403).json({
        success: false,
        canInstall: false,
        installCount: deviceInstall.installCount,
        remainingInstalls: 0,
        isBlocked: true,
        message: `Siz maksimal o\'rnatish limitiga yetdingiz (${MAX_INSTALL_LIMIT} marta). Iltimos, qo\'llab-quvvatlash xizmatiga murojaat qiling.`,
        lastInstallDate: deviceInstall.lastInstallDate
      });
    }
    // Device can install
    return res.json({
      success: true,
      canInstall: true,
      installCount: deviceInstall.installCount,
      remainingInstalls: MAX_INSTALL_LIMIT - deviceInstall.installCount,
      message: `Ilovani o\'rnatishingiz mumkin. Qolgan o\'rnatishlar: ${MAX_INSTALL_LIMIT - deviceInstall.installCount}`
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server xatosi'
    });
  }
};
/**
 * Record app installation
 * POST /api/install/record
 */
export const recordInstallation = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { deviceInfo } = req.body;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
    // Validate device info
    if (!DeviceFingerprintService.validateDeviceInfo(deviceInfo)) {
      return res.status(400).json({
        success: false,
        message: 'Noto\'g\'ri qurilma ma\'lumotlari'
      });
    }
    // Generate device identifiers
    const deviceId = DeviceFingerprintService.generateDeviceId(deviceInfo);
    const deviceFingerprint = DeviceFingerprintService.generateFingerprint(deviceInfo, userId);
    // Find or create device install record
    let deviceInstall = await DeviceInstall.findOne({
      userId,
      deviceFingerprint
    });
    if (!deviceInstall) {
      // Check by deviceId
      deviceInstall = await DeviceInstall.findOne({
        userId,
        deviceId
      });
    }
    // Create new device record
    if (!deviceInstall) {
      deviceInstall = new DeviceInstall({
        userId,
        deviceId,
        deviceFingerprint,
        deviceInfo,
        installCount: 0,
        installHistory: []
      });
    }
    // Check if can install
    if (!(deviceInstall as any).canInstall()) {
      return res.status(403).json({
        success: false,
        message: `O\'rnatish limiti tugadi (${MAX_INSTALL_LIMIT} marta)`,
        installCount: deviceInstall.installCount,
        isBlocked: true
      });
    }
    // Record installation
    await (deviceInstall as any).recordInstall(ipAddress);
    return res.json({
      success: true,
      message: 'Ilova muvaffaqiyatli o\'rnatildi',
      installCount: deviceInstall.installCount,
      remainingInstalls: MAX_INSTALL_LIMIT - deviceInstall.installCount,
      isBlocked: deviceInstall.isBlocked
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server xatosi'
    });
  }
};
/**
 * Get user's install history
 * GET /api/install/history
 */
export const getInstallHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const devices = await DeviceInstall.find({ userId })
      .select('-deviceFingerprint')
      .sort({ lastInstallDate: -1 });
    const totalInstalls = devices.reduce((sum, device) => sum + device.installCount, 0);
    return res.json({
      success: true,
      totalDevices: devices.length,
      totalInstalls,
      maxInstallsPerDevice: MAX_INSTALL_LIMIT,
      devices: devices.map(device => ({
        deviceId: device.deviceId,
        platform: device.deviceInfo.platform,
        installCount: device.installCount,
        isBlocked: device.isBlocked,
        lastInstallDate: device.lastInstallDate,
        installHistory: device.installHistory
      }))
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server xatosi'
    });
  }
};
/**
 * Admin: Reset device install count
 * POST /api/install/reset/:deviceId
 */
export const resetDeviceInstalls = async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const userId = (req as any).user.id;
    // Check if user is admin (add your admin check logic)
    const user = (req as any).user;
    if (user.role !== 'master') {
      return res.status(403).json({
        success: false,
        message: 'Ruxsat yo\'q'
      });
    }
    const deviceInstall = await DeviceInstall.findOne({ deviceId });
    if (!deviceInstall) {
      return res.status(404).json({
        success: false,
        message: 'Qurilma topilmadi'
      });
    }
    // Reset install count
    deviceInstall.installCount = 0;
    deviceInstall.isBlocked = false;
    await deviceInstall.save();
    return res.json({
      success: true,
      message: 'Qurilma o\'rnatish hisobi tiklandi'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server xatosi'
    });
  }
};

import express from 'express';
import {
  checkInstallEligibility,
  recordInstallation,
  getInstallHistory,
  resetDeviceInstalls
} from '../controllers/installController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Check if device can install
router.post('/check', checkInstallEligibility);

// Record installation
router.post('/record', recordInstallation);

// Get install history
router.get('/history', getInstallHistory);

// Admin: Reset device installs
router.post('/reset/:deviceId', resetDeviceInstalls);

export default router;

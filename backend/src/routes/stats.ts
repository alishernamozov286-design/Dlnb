import express from 'express';
import { getPublicStats, getEarningsStats } from '../controllers/statsController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Public endpoint - authentication kerak emas
router.get('/public', getPublicStats);

// Earnings stats - faqat master uchun
router.get('/earnings', authenticate, getEarningsStats);

export default router;

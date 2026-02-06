import express from 'express';
import { getPublicStats, getEarningsStats, getApprenticeEarnings } from '../controllers/statsController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Public endpoint - authentication kerak emas
router.get('/public', getPublicStats);

// Earnings stats - faqat master uchun
router.get('/earnings', authenticate, getEarningsStats);

// Apprentice earnings - shogird o'z daromadlarini ko'rishi uchun
router.get('/apprentice/earnings', authenticate, getApprenticeEarnings);

export default router;

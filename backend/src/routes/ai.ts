import express from 'express';
import { body } from 'express-validator';
import { getCarDiagnosticAdvice } from '../controllers/aiController';
import { authenticate } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';

const router = express.Router();

// Get AI diagnostic advice
router.post('/diagnostic', authenticate, [
  body('problem').trim().isLength({ min: 5 }).withMessage('Muammo kamida 5 ta belgidan iborat bo\'lishi kerak'),
  body('carModel').optional().trim(),
  handleValidationErrors
], getCarDiagnosticAdvice);

export default router;

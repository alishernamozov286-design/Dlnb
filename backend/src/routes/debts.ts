import express from 'express';
import { body } from 'express-validator';
import {
  createDebt,
  getDebts,
  getDebtById,
  addPayment,
  updateDebt,
  deleteDebt,
  getDebtSummary,
  sendDebtReminders,
  getUpcomingDebts,
  getOverdueDebtsCount
} from '../controllers/debtController';
import { authenticate, authorize } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';

const router = express.Router();

// Create debt (master only)
router.post('/', authenticate, authorize('master'), [
  body('type').isIn(['receivable', 'payable']).withMessage('Type must be receivable or payable'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('creditorName').trim().isLength({ min: 2 }).withMessage('Creditor name must be at least 2 characters'),
  handleValidationErrors
], createDebt);

// Get debts
router.get('/', authenticate, getDebts);

// Get debt summary
router.get('/summary', authenticate, getDebtSummary);

// Get upcoming debts (muddati yaqin qarzlar)
router.get('/upcoming', authenticate, authorize('master'), getUpcomingDebts);

// Get debts count (due within 3 days or overdue) - sidebar notification uchun
router.get('/overdue/count', authenticate, authorize('master'), getOverdueDebtsCount);

// Send debt reminders (master only) - Manual trigger
router.post('/reminders/send', authenticate, authorize('master'), sendDebtReminders);

// Get debt by ID
router.get('/:id', authenticate, getDebtById);

// Add payment (master only)
router.post('/:id/payments', authenticate, authorize('master'), [
  body('amount').isFloat({ min: 0 }).withMessage('Payment amount must be a positive number'),
  handleValidationErrors
], addPayment);

// Update debt (master only)
router.put('/:id', authenticate, authorize('master'), updateDebt);

// Delete debt (master only)
router.delete('/:id', authenticate, authorize('master'), deleteDebt);

export default router;
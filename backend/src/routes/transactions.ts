import express from 'express';
import { body } from 'express-validator';
import {
  createTransaction,
  getTransactions,
  getTransactionById,
  getTransactionSummary,
  getTransactionStats,
  deleteTransaction,
  bulkDeleteTransactions
} from '../controllers/transactionControllerOptimized';
import { resetMonthlyEarnings, getMonthlyHistory, getMonthHistory, deleteMonthlyHistory } from '../controllers/transactionController';
import { authenticate, authorize } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';

const router = express.Router();

// Create transaction (master only)
router.post('/', authenticate, authorize('master'), [
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('category').trim().isLength({ min: 2 }).withMessage('Category must be at least 2 characters'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('description').trim().isLength({ min: 2 }).withMessage('Description must be at least 2 characters'),
  body('paymentMethod').isIn(['cash', 'card', 'click']).withMessage('Invalid payment method'),
  handleValidationErrors
], createTransaction);

// Get transactions with advanced filtering and pagination
router.get('/', authenticate, getTransactions);

// Get transaction summary with period filtering
router.get('/summary', authenticate, getTransactionSummary);

// Get transaction statistics
router.get('/stats', authenticate, getTransactionStats);

// Reset monthly earnings (master only)
router.post('/reset-monthly', authenticate, authorize('master'), resetMonthlyEarnings);

// Get monthly history (master only)
router.get('/monthly-history', authenticate, authorize('master'), getMonthlyHistory);

// Get specific month history (master only)
router.get('/monthly-history/:year/:month', authenticate, authorize('master'), getMonthHistory);

// Delete monthly history (master only)
router.delete('/monthly-history/:id', authenticate, authorize('master'), deleteMonthlyHistory);

// Bulk delete transactions (master only)
router.post('/bulk-delete', authenticate, authorize('master'), [
  body('ids').isArray({ min: 1 }).withMessage('IDs array is required'),
  body('ids.*').isMongoId().withMessage('Invalid transaction ID'),
  handleValidationErrors
], bulkDeleteTransactions);

// Export transactions (placeholder - would need actual implementation)
router.get('/export', authenticate, (req, res) => {
  res.status(501).json({ message: 'Export functionality not yet implemented' });
});

// Get transaction by ID
router.get('/:id', authenticate, getTransactionById);

// Delete transaction (master only)
router.delete('/:id', authenticate, authorize('master'), deleteTransaction);

export default router;

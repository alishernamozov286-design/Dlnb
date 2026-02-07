import express from 'express';
import { body } from 'express-validator';
import {
  searchSpareParts,
  getSpareParts,
  getSparePartById,
  createSparePart,
  createSparePartWithExpense,
  updateSparePart,
  deleteSparePart,
  incrementUsage,
  getRequiredParts,
  removeRequiredPart,
  addRequiredPartToInventory,
  sellSparePart,
  getSalesStatistics,
  getSales
} from '../controllers/sparePartController';
import { authenticate, authorize } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';

const router = express.Router();

// Search spare parts (for autocomplete)
router.get('/search', authenticate, searchSpareParts);

// Get all spare parts
router.get('/', authenticate, getSpareParts);

// Get required parts (client keltirish kerak)
router.get('/required/list', authenticate, getRequiredParts);

// Get sales statistics
router.get('/sales/statistics', authenticate, getSalesStatistics);

// Get sales list
router.get('/sales', authenticate, getSales);

// Get spare part by ID
router.get('/:id', authenticate, getSparePartById);

// Create spare part (master only) - SUPPLIER VALIDATION REMOVED
router.post('/', authenticate, authorize('master'), [
  body('name').trim().isLength({ min: 2 }).withMessage('Zapchast nomi kamida 2 ta belgidan iborat bo\'lishi kerak'),
  body('price').isFloat({ min: 0 }).withMessage('Narx 0 dan katta bo\'lishi kerak'),
  body('quantity').isInt({ min: 0 }).withMessage('Miqdor 0 dan kichik bo\'lmasligi kerak')
], handleValidationErrors, createSparePart);

// Create spare part with expense (master only - from Cashier page) - SUPPLIER VALIDATION REMOVED
router.post('/with-expense', authenticate, authorize('master'), [
  body('name').trim().isLength({ min: 2 }).withMessage('Zapchast nomi kamida 2 ta belgidan iborat bo\'lishi kerak'),
  body('costPrice').optional().isFloat({ min: 0 }).withMessage('Tannarx 0 dan katta bo\'lishi kerak'),
  body('sellingPrice').optional().isFloat({ min: 0 }).withMessage('Sotish narxi 0 dan katta bo\'lishi kerak'),
  body('quantity').isInt({ min: 0 }).withMessage('Miqdor 0 dan kichik bo\'lmasligi kerak'),
  body('paymentMethod').isIn(['cash', 'card']).withMessage('To\'lov usuli noto\'g\'ri')
], handleValidationErrors, createSparePartWithExpense);

// Update spare part (master only) - SUPPLIER VALIDATION REMOVED
router.put('/:id', authenticate, authorize('master'), [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Zapchast nomi kamida 2 ta belgidan iborat bo\'lishi kerak'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Narx 0 dan katta bo\'lishi kerak'),
  body('quantity').optional().isInt({ min: 0 }).withMessage('Miqdor 0 dan kichik bo\'lmasligi kerak')
], handleValidationErrors, updateSparePart);

// Delete spare part (master only)
router.delete('/:id', authenticate, authorize('master'), deleteSparePart);

// Increment usage count (internal use)
router.patch('/:id/increment-usage', authenticate, incrementUsage);

// Remove required part from car
router.delete('/required/:carId/:partId', authenticate, authorize('master'), removeRequiredPart);

// Add required part to inventory
router.post('/required/:carId/:partId/add-to-inventory', authenticate, authorize('master'), addRequiredPartToInventory);

// Sell spare part
router.post('/sell', authenticate, [
  body('sparePartId').notEmpty().withMessage('Zapchast ID kiritilishi shart'),
  body('quantity').isInt({ min: 1 }).withMessage('Miqdor kamida 1 bo\'lishi kerak'),
  body('sellingPrice').optional().isFloat({ min: 0 }).withMessage('Sotish narxi 0 dan katta bo\'lishi kerak')
], handleValidationErrors, sellSparePart);

export default router;

import express from 'express';
import { body } from 'express-validator';
import {
  getExpenseCategories,
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
  initializeDefaultCategories
} from '../controllers/expenseCategoryController';
import { authenticate } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';

const router = express.Router();

// Get all expense categories
router.get('/', authenticate, getExpenseCategories);

// Initialize default categories
router.post('/initialize', authenticate, initializeDefaultCategories);

// Create new expense category
router.post('/', authenticate, [
  body('nameUz')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Kategoriya nomi 2-50 ta belgi bo\'lishi kerak'),
  body('description')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Tavsif 5-200 ta belgi bo\'lishi kerak'),
  body('icon')
    .optional()
    .isIn(['ShoppingCart', 'Home', 'Zap', 'Users', 'DollarSign', 'Package', 'Truck', 'Wrench', 'Settings'])
    .withMessage('Noto\'g\'ri ikon tanlangan'),
  body('color')
    .optional()
    .isIn(['blue', 'green', 'yellow', 'purple', 'red', 'indigo', 'pink', 'gray'])
    .withMessage('Noto\'g\'ri rang tanlangan'),
  handleValidationErrors
], createExpenseCategory);

// Update expense category
router.put('/:id', authenticate, [
  body('nameUz')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Kategoriya nomi 2-50 ta belgi bo\'lishi kerak'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Tavsif 5-200 ta belgi bo\'lishi kerak'),
  body('icon')
    .optional()
    .isIn(['ShoppingCart', 'Home', 'Zap', 'Users', 'DollarSign', 'Package', 'Truck', 'Wrench', 'Settings'])
    .withMessage('Noto\'g\'ri ikon tanlangan'),
  body('color')
    .optional()
    .isIn(['blue', 'green', 'yellow', 'purple', 'red', 'indigo', 'pink', 'gray'])
    .withMessage('Noto\'g\'ri rang tanlangan'),
  handleValidationErrors
], updateExpenseCategory);

// Delete expense category
router.delete('/:id', authenticate, deleteExpenseCategory);

export default router;
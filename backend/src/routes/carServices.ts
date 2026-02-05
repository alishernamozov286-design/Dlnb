import express from 'express';
import { body } from 'express-validator';
import {
  createCarService,
  getCarServices,
  getCarServiceById,
  updateCarService,
  deleteCarService,
  updateServiceStatus,
  approveService,
  rejectService,
  restartService,
  addServiceItem,
  updateServiceItem,
  removeServiceItem,
  addCarServicePayment
} from '../controllers/carServiceController';
import { authenticate, authorize } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';

const router = express.Router();

// Create car service (master only)
router.post('/', authenticate, authorize('master'), [
  body('carId').isMongoId().withMessage('Valid car ID is required'),
  body('parts').isArray({ min: 1 }).withMessage('At least one part is required'),
  body('parts.*.name').notEmpty().withMessage('Part name is required'),
  body('parts.*.price').isNumeric().withMessage('Price must be a number'),
  body('parts.*.category').isIn(['part', 'material', 'labor']).withMessage('Category must be part, material, or labor'),
  handleValidationErrors
], createCarService);

// Get car services
router.get('/', authenticate, getCarServices);

// Get car service by ID
router.get('/:id', authenticate, getCarServiceById);

// Update car service (master only)
router.put('/:id', authenticate, authorize('master'), updateCarService);

// Delete car service (master only)
router.delete('/:id', authenticate, authorize('master'), deleteCarService);

// Update service status
router.patch('/:id/status', authenticate, authorize('master'), [
  body('status').isIn(['pending', 'in-progress', 'ready-for-delivery', 'rejected', 'completed', 'delivered']).withMessage('Invalid status'),
  handleValidationErrors
], updateServiceStatus);

// Approve service (master only) - changes status from ready-for-delivery to completed
router.patch('/:id/approve', authenticate, authorize('master'), approveService);

// Reject service (master only) - changes status from ready-for-delivery to rejected
router.patch('/:id/reject', authenticate, authorize('master'), [
  body('rejectionReason').optional().trim().isLength({ min: 3 }).withMessage('Rejection reason must be at least 3 characters'),
  handleValidationErrors
], rejectService);

// Restart service (apprentice can restart rejected service)
router.patch('/:id/restart', authenticate, restartService);

// Add payment to service (master only)
router.post('/:id/payment', authenticate, authorize('master'), [
  body('amount').isFloat({ min: 0.01 }).withMessage('Payment amount must be greater than 0'),
  body('paymentMethod').optional().isIn(['cash', 'card', 'click']).withMessage('Invalid payment method'),
  handleValidationErrors
], addCarServicePayment);

// Service items routes
router.post('/:serviceId/items', authenticate, authorize('master'), [
  body('name').trim().isLength({ min: 2 }).withMessage('Item name must be at least 2 characters'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('category').isIn(['part', 'material', 'labor']).withMessage('Category must be part, material, or labor'),
  handleValidationErrors
], addServiceItem);

router.put('/:serviceId/items/:itemId', authenticate, authorize('master'), updateServiceItem);
router.delete('/:serviceId/items/:itemId', authenticate, authorize('master'), removeServiceItem);

export default router;
import express from 'express';
import { body } from 'express-validator';
import {
  getBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
  getBookingStats,
} from '../controllers/bookingController';
import { authenticate, authorize } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';

const router = express.Router();

// Get all bookings
router.get('/', authenticate, getBookings);

// Get booking statistics
router.get('/stats', authenticate, getBookingStats);

// Get booking by ID
router.get('/:id', authenticate, getBookingById);

// Create booking
router.post(
  '/',
  authenticate,
  [
    body('customerName').trim().notEmpty().withMessage('Mijoz ismi kiritilishi shart'),
    body('phoneNumber').trim().notEmpty().withMessage('Telefon raqam kiritilishi shart'),
    body('licensePlate').trim().notEmpty().withMessage('Davlat raqami kiritilishi shart'),
    body('bookingDate').isISO8601().withMessage('To\'g\'ri sana kiritilishi shart'),
    handleValidationErrors,
  ],
  createBooking
);

// Update booking
router.put(
  '/:id',
  authenticate,
  [
    body('customerName').optional().trim().notEmpty(),
    body('phoneNumber').optional().trim().notEmpty(),
    body('licensePlate').optional().trim().notEmpty(),
    body('bookingDate').optional().isISO8601(),
    body('status').optional().isIn(['pending', 'confirmed', 'completed', 'cancelled']),
    handleValidationErrors,
  ],
  updateBooking
);

// Delete booking
router.delete('/:id', authenticate, deleteBooking);

export default router;

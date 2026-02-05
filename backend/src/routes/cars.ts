import express from 'express';
import { body } from 'express-validator';
import {
  createCar,
  getCars,
  getCarById,
  updateCar,
  addPart,
  updatePart,
  deletePart,
  deleteCar,
  getCarServices,
  getClientParts,
  getArchivedCars,
  restoreCar,
  addCarPayment,
  completeCar
} from '../controllers/carController';
import { authenticate } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';
import telegramService from '../services/telegramService';

const router = express.Router();

// Test Telegram bot
router.get('/telegram/test', authenticate, async (req, res) => {
  try {
    const result = await telegramService.sendTestMessage();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Debug: Ro'yxatdan o'tgan telefon raqamlarini ko'rish
router.get('/telegram/registered-phones', authenticate, async (req, res) => {
  try {
    const carPhones = telegramService.getRegisteredCarPhones();
    const debtPhones = telegramService.getRegisteredDebtPhones();
    
    res.json({
      success: true,
      data: {
        carPhones,
        debtPhones,
        totalCarUsers: carPhones.length,
        totalDebtUsers: debtPhones.length
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Debug: Telefon raqamini tekshirish
router.post('/telegram/check-phone', authenticate, async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number required' });
    }
    
    const result = telegramService.checkCustomerPhone(phone);
    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create car
router.post('/', authenticate, [
  body('make').trim().isLength({ min: 2 }).withMessage('Make must be at least 2 characters'),
  body('carModel').trim().isLength({ min: 2 }).withMessage('Model must be at least 2 characters'),
  body('year').isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage('Invalid year'),
  body('licensePlate')
    .custom((value) => {
      const plateClean = value.replace(/\s/g, '').toUpperCase();
      const isOldFormat = /^[0-9]{2}[A-Z]{1}[0-9]{3}[A-Z]{2}$/.test(plateClean);
      const isNewFormat = /^[0-9]{5}[A-Z]{3}$/.test(plateClean);
      
      if (!isOldFormat && !isNewFormat) {
        throw new Error('Davlat raqami noto\'g\'ri formatda. Masalan: 01 A 123 BC yoki 01 123 ABC');
      }
      return true;
    }),
  body('ownerName').trim().isLength({ min: 2 }).withMessage('Owner name must be at least 2 characters'),
  body('ownerPhone')
    .custom((value) => {
      // Telefon raqamini tozalash (faqat raqamlar)
      const phoneDigits = value.replace(/\D/g, '');
      
      // 998 bilan boshlanishi va 12 ta raqam bo'lishi kerak
      if (!phoneDigits.startsWith('998') || phoneDigits.length !== 12) {
        throw new Error('Telefon raqami 998 bilan boshlanishi va 12 ta raqamdan iborat bo\'lishi kerak');
      }
      
      return true;
    }),
  handleValidationErrors
], createCar);

// Get cars
router.get('/', authenticate, getCars);

// Get archived cars
router.get('/archived/list', authenticate, getArchivedCars);

// Get client parts (keltirish kerak bo'lgan qismlar)
router.get('/client-parts', authenticate, getClientParts);

// Get car by ID
router.get('/:id', authenticate, getCarById);

// Get car services
router.get('/:id/services', authenticate, getCarServices);

// Update car
router.put('/:id', authenticate, updateCar);

// Add part to car
router.post('/:id/parts', authenticate, [
  body('name').trim().isLength({ min: 2 }).withMessage('Part name must be at least 2 characters'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('status').isIn(['needed', 'ordered', 'available', 'installed']).withMessage('Invalid status'),
  handleValidationErrors
], addPart);

// Update part
router.put('/:id/parts/:partId', authenticate, updatePart);

// Delete part
router.delete('/:id/parts/:partId', authenticate, deletePart);

// Add payment to car
router.post('/:id/payment', authenticate, [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('paymentMethod').isIn(['cash', 'card', 'click']).withMessage('Invalid payment method'),
  handleValidationErrors
], addCarPayment);

// Complete car work
router.post('/:id/complete', authenticate, [
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes must be less than 500 characters'),
  handleValidationErrors
], completeCar);

// Delete car
router.delete('/:id', authenticate, deleteCar);

// Restore car from archive
router.post('/:id/restore', authenticate, restoreCar);

export default router;
import express from 'express';
import { body } from 'express-validator';
import { register, login, getProfile, getApprentices, getUsers, getApprenticesWithStats, updateUser, deleteUser } from '../controllers/authController';
import { authenticate, authorize } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';
import { upload } from '../middleware/upload';

const router = express.Router();

// Register
router.post('/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['master', 'apprentice']).withMessage('Role must be either master or apprentice'),
  handleValidationErrors
], register);

// Login
router.post('/login', [
  body('username').optional().trim().isLength({ min: 1 }).withMessage('Username must not be empty'),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('phone').optional().trim().isLength({ min: 9 }).withMessage('Telefon raqam noto\'g\'ri'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  // Custom validation: username/email + password YOKI username + phone
  body().custom((value, { req }) => {
    const { username, email, password, phone } = req.body;
    
    // Agar telefon raqam berilgan bo'lsa (shogirt)
    if (phone) {
      if (!username) {
        throw new Error('Username kiritilishi kerak');
      }
      return true;
    }
    
    // Agar telefon yo'q bo'lsa (ustoz)
    if (!username && !email) {
      throw new Error('Username or email is required');
    }
    if (!password) {
      throw new Error('Password is required');
    }
    
    return true;
  }),
  handleValidationErrors
], login);

// Get profile
router.get('/profile', authenticate, getProfile);

// Get current user (me)
router.get('/me', authenticate, getProfile);

// Get users (authenticated users can see apprentices, masters can see all)
router.get('/users', authenticate, (req, res, next) => {
  const { role } = req.query;
  
  // Agar shogird bo'lsa, faqat boshqa shogirdlarni ko'ra oladi
  if ((req as any).user.role === 'apprentice' && role !== 'apprentice') {
    return res.status(403).json({ message: 'Access denied' });
  }
  
  next();
}, getUsers);

// Create user (master only) - same as register but for masters to create users
router.post('/users', authenticate, authorize('master'), [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['master', 'apprentice']).withMessage('Role must be either master or apprentice'),
  handleValidationErrors
], register);

// Public endpoint - Get apprentices for landing page (no auth required)
router.get('/public/apprentices', async (req, res) => {
  try {
    const User = require('../models/User').default;
    const apprentices = await User.find({ role: 'apprentice' })
      .select('name username profileImage profession experience createdAt')
      .lean();
    res.json({ users: apprentices });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get apprentices with stats (master only)
router.get('/apprentices/stats', authenticate, authorize('master'), getApprenticesWithStats);

// Get apprentices (master only)
router.get('/apprentices', authenticate, authorize('master'), getApprentices);

// Update user (master only)
router.patch('/users/:id', authenticate, authorize('master'), [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('username').optional().trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidationErrors
], updateUser);

// Delete user (master only)
router.delete('/users/:id', authenticate, authorize('master'), deleteUser);

// Upload profile image
router.post('/upload-profile-image', authenticate, upload.single('profileImage'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Rasm yuklanmadi' });
    }

    const imageUrl = `/uploads/profiles/${req.file.filename}`;
    res.json({ 
      message: 'Rasm muvaffaqiyatli yuklandi',
      imageUrl 
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Rasm yuklashda xatolik', error: error.message });
  }
});

export default router;

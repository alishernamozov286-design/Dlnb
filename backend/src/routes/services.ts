import express from 'express';
import {
  createService,
  getServices,
  updateService,
  deleteService,
  getPublicServices,
} from '../controllers/serviceController';
import { authenticate } from '../middleware/auth';
import { uploadServiceImage } from '../middleware/upload';

const router = express.Router();

// Public route - authentication not required
router.get('/public', getPublicServices);

// Protected routes
router.post('/', authenticate, uploadServiceImage, createService);
router.get('/', authenticate, getServices);
router.put('/:id', authenticate, uploadServiceImage, updateService);
router.delete('/:id', authenticate, deleteService);

export default router;

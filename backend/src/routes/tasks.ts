import express from 'express';
import { body } from 'express-validator';
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  approveTask,
  getTaskStats,
  restartTask,
  deleteTask
} from '../controllers/taskController';
import { authenticate, authorize } from '../middleware/auth';
import { handleValidationErrors } from '../middleware/validation';

const router = express.Router();

// Create task (authenticated users can create tasks)
router.post('/', authenticate, [
  body('title').trim().isLength({ min: 3 }).withMessage('Vazifa nomi kamida 3 ta belgidan iborat bo\'lishi kerak'),
  body('description').trim().isLength({ min: 5 }).withMessage('Tavsif kamida 5 ta belgidan iborat bo\'lishi kerak'),
  body('assignedTo').optional().isMongoId().withMessage('Noto\'g\'ri shogird ID'),
  body('assignments').optional().isArray().withMessage('Assignments array bo\'lishi kerak'),
  body('assignments.*.apprenticeId').optional().isMongoId().withMessage('Noto\'g\'ri shogird ID'),
  body('assignments.*.percentage').optional().isInt({ min: 0, max: 100 }).withMessage('Foiz 0-100 oralig\'ida bo\'lishi kerak'),
  body('car').isMongoId().withMessage('Noto\'g\'ri mashina ID'),
  body('priority').isIn(['low', 'medium', 'high', 'urgent']).withMessage('Noto\'g\'ri muhimlik darajasi'),
  body('dueDate').isISO8601().withMessage('Noto\'g\'ri sana formati'),
  body('estimatedHours').isFloat({ min: 0.5 }).withMessage('Taxminiy vaqt kamida 0.5 soat bo\'lishi kerak'),
  body('payment').optional().isFloat({ min: 0 }).withMessage('To\'lov miqdori 0 dan katta bo\'lishi kerak'),
  handleValidationErrors
], createTask);

// Get tasks
router.get('/', authenticate, getTasks);

// Get task stats
router.get('/stats', authenticate, getTaskStats);

// Get task by ID
router.get('/:id', authenticate, getTaskById);

// Update task (master can update any task, apprentice can update their own tasks)
router.put('/:id', authenticate, [
  body('title').optional().trim().isLength({ min: 3 }).withMessage('Vazifa nomi kamida 3 ta belgidan iborat bo\'lishi kerak'),
  body('description').optional().trim().isLength({ min: 5 }).withMessage('Tavsif kamida 5 ta belgidan iborat bo\'lishi kerak'),
  body('assignedTo').optional().isMongoId().withMessage('Noto\'g\'ri shogird ID'),
  body('car').optional().isMongoId().withMessage('Noto\'g\'ri mashina ID'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Noto\'g\'ri muhimlik darajasi'),
  body('dueDate').optional().isISO8601().withMessage('Noto\'g\'ri sana formati'),
  body('estimatedHours').optional().isFloat({ min: 0.5 }).withMessage('Taxminiy vaqt kamida 0.5 soat bo\'lishi kerak'),
  body('payment').optional().isFloat({ min: 0 }).withMessage('To\'lov miqdori 0 dan katta bo\'lishi kerak'),
  handleValidationErrors
], updateTask);

// Update task status
router.patch('/:id/status', authenticate, [
  body('status').isIn(['assigned', 'in-progress', 'completed', 'approved', 'rejected']).withMessage('Invalid status'),
  handleValidationErrors
], updateTaskStatus);

// Approve/reject task (master only)
router.patch('/:id/approve', authenticate, authorize('master'), [
  body('approved').isBoolean().withMessage('Approved must be a boolean'),
  handleValidationErrors
], approveTask);

// Restart rejected task
router.patch('/:id/restart', authenticate, restartTask);

// Delete task (master can delete any task, apprentice can delete their own tasks)
router.delete('/:id', authenticate, deleteTask);

export default router;
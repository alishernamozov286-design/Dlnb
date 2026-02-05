import express from 'express';
import { body } from 'express-validator';
import { 
  sendChatMessage, 
  getChatHistory, 
  clearChatHistory,
  getSubscriptionStatus
} from '../controllers/chatController';
import { optionalAuth } from '../middleware/auth';
import { checkSubscription } from '../middleware/subscription';
import { handleValidationErrors } from '../middleware/validation';

const router = express.Router();

// Send chat message (authenticated or anonymous)
router.post('/message', 
  optionalAuth,
  checkSubscription,
  [
    body('message').trim().isLength({ min: 1 }).withMessage('Xabar bo\'sh bo\'lishi mumkin emas'),
    body('sessionId').trim().isLength({ min: 1 }).withMessage('Session ID kerak'),
    handleValidationErrors
  ],
  sendChatMessage
);

// Get chat history
router.get('/history/:sessionId', 
  optionalAuth,
  getChatHistory
);

// Clear chat history
router.delete('/history/:sessionId', 
  optionalAuth,
  clearChatHistory
);

// Get subscription status
router.get('/subscription', 
  optionalAuth,
  getSubscriptionStatus
);

export default router;

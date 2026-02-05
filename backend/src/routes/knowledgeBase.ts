import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  createKnowledge,
  getKnowledgeList,
  updateKnowledge,
  deleteKnowledge,
  searchKnowledge
} from '../controllers/knowledgeBaseController';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// CRUD operations
router.post('/', createKnowledge);
router.get('/', getKnowledgeList);
router.put('/:id', updateKnowledge);
router.delete('/:id', deleteKnowledge);

// Search for AI
router.get('/search', searchKnowledge);

export default router;

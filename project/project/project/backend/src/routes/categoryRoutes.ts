import { Router } from 'express';
import {
  getCategories,
  getActiveCategories,
  createCategory,
  editCategory,
  deleteCategory,
  seedCategories,
} from '../controllers/categoryController';
import { authenticateUser, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', getCategories as any);
router.get('/active', getActiveCategories as any);
router.post('/seed', seedCategories as any);

// Protected Admin CRUD
router.post('/', authenticateUser as any, requireAdmin as any, createCategory as any);
router.put('/:id', authenticateUser as any, requireAdmin as any, editCategory as any);
router.delete('/:id', authenticateUser as any, requireAdmin as any, deleteCategory as any);

export default router;

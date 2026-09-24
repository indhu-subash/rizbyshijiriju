import { Router } from 'express';
import {
  getActiveCollections,
  getAdminCollections,
  getCollectionBySlug,
  createCollection,
  editCollection,
  toggleCollectionActive,
  deleteCollection,
  seedCollections,
} from '../controllers/collectionController';
import { authenticateUser, requireAdmin } from '../middleware/auth';

const router = Router();

// Public Storefront Routes
router.get('/', getActiveCollections);
router.get('/seed', seedCollections);

// Protected Admin Routes
router.get('/admin/all', authenticateUser, requireAdmin, getAdminCollections);
router.post('/', authenticateUser, requireAdmin, createCollection);
router.put('/:id', authenticateUser, requireAdmin, editCollection);
router.patch('/:id/toggle', authenticateUser, requireAdmin, toggleCollectionActive);
router.delete('/:id', authenticateUser, requireAdmin, deleteCollection);

// Public Collection Details Route
router.get('/:slug', getCollectionBySlug);

export default router;

import { Router } from 'express';
import { getCategories, getActiveCategories, seedCategories } from '../controllers/categoryController';

const router = Router();

router.get('/', getCategories as any);
router.get('/active', getActiveCategories as any);
router.post('/seed', seedCategories as any);

export default router;

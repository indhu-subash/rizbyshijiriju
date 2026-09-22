import { Router } from 'express';
import { getProducts, getProductBySlug, getProductById } from '../controllers/productController';

const router = Router();

router.get('/', getProducts as any);
router.get('/slug/:slug', getProductBySlug as any);
router.get('/:id', getProductById as any);

export default router;

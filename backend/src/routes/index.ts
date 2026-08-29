import { Router } from 'express';
import authRoutes from './authRoutes';
import productRoutes from './productRoutes';
import orderRoutes from './orderRoutes';
import paymentRoutes from './paymentRoutes';
import adminRoutes from './adminRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/admin', adminRoutes);

export default router;

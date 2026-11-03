import { Router } from 'express';
import authRoutes from './authRoutes';
import productRoutes from './productRoutes';
import categoryRoutes from './categoryRoutes';
import collectionRoutes from './collectionRoutes';
import orderRoutes from './orderRoutes';
import paymentRoutes from './paymentRoutes';
import adminRoutes from './adminRoutes';
import { calculateShippingEndpoint } from '../controllers/orderController';
import { getPublicCoupons } from '../controllers/couponController';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/collections', collectionRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/admin', adminRoutes);

// Direct endpoint for shipping calculation
router.post('/shipping/calculate', calculateShippingEndpoint as any);
router.get('/coupons/public', getPublicCoupons as any);

export default router;

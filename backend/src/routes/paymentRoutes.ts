import { Router } from 'express';
import { createCheckoutOrder, verifyPayment } from '../controllers/paymentController';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// Require login for checking out/payment verification (or make authenticateUser check if logged in)
router.post('/checkout', authenticateUser as any, createCheckoutOrder as any);
router.post('/verify', authenticateUser as any, verifyPayment as any);

export default router;

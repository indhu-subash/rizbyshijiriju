import { Router } from 'express';
import { createCheckoutOrder, verifyPayment, cancelOrder, handleRazorpayWebhook } from '../controllers/paymentController';
import { optionalAuthenticateUser } from '../middleware/auth';

const router = Router();

// Allow optional user auth for guest/authenticated checkout
router.post('/checkout', optionalAuthenticateUser as any, createCheckoutOrder as any);
router.post('/verify', optionalAuthenticateUser as any, verifyPayment as any);
router.post('/cancel', optionalAuthenticateUser as any, cancelOrder as any);
router.post('/webhook', handleRazorpayWebhook as any);

export default router;



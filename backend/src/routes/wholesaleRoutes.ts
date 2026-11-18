import { Router } from 'express';
import { createWholesaleEnquiry } from '../controllers/wholesaleController';

const router = Router();

// Public: submit a wholesale enquiry. Listing / status updates live under /api/admin (protected).
router.post('/enquiries', createWholesaleEnquiry as any);

export default router;

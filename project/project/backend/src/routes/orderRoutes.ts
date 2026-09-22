import { Router } from 'express';
import {
  getUserOrders,
  getOrderDetails,
  trackOrder,
  checkPincodeShipping,
  calculateShippingEndpoint,
} from '../controllers/orderController';
import { authenticateUser } from '../middleware/auth';

const router = Router();

router.get('/my', authenticateUser as any, getUserOrders as any);
router.get('/detail/:id', authenticateUser as any, getOrderDetails as any);
router.get('/track/:orderId', trackOrder as any);
router.get('/shipping/pincode/:pincode', checkPincodeShipping as any);
router.post('/shipping/calculate', calculateShippingEndpoint as any);

export default router;

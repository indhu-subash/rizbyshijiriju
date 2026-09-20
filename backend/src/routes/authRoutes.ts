import { Router } from 'express';
import {
  register,
  login,
  logout,
  me,
  getAddresses,
  addAddress,
  deleteAddress,
} from '../controllers/authController';
import { authenticateUser } from '../middleware/auth';

const router = Router();

router.post('/register', register as any);
router.post('/login', login as any);
router.post('/logout', logout as any);
router.get('/me', authenticateUser as any, me as any);

// Addresses routes
router.get('/addresses', authenticateUser as any, getAddresses as any);
router.post('/addresses', authenticateUser as any, addAddress as any);
router.delete('/addresses/:id', authenticateUser as any, deleteAddress as any);

export default router;

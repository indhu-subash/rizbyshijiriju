import { Router } from 'express';
import multer from 'multer';
import {
  getDashboardStats,
  getAdminOrders,
  updateOrderStatus,
  getAdminProducts,
  createProduct,
  editProduct,
  deleteProduct,
  getAdminCoupons,
  createCoupon,
  editCoupon,
  deleteCoupon,
  getAdminCustomers,
  adminUploadProductImage,
  getAdminShippingRules,
  createShippingRule,
  editShippingRule,
  deleteShippingRule,
} from '../controllers/adminController';
import {
  getCategories,
  createCategory,
  editCategory,
  deleteCategory,
  seedCategories,
} from '../controllers/categoryController';
import { authenticateUser, requireAdmin } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Apply auth & admin checks to all admin routes
router.use(authenticateUser as any);
router.use(requireAdmin as any);

router.get('/stats', getDashboardStats as any);

// Categories Admin CRUD
router.get('/categories', getCategories as any);
router.post('/categories', createCategory as any);
router.put('/categories/:id', editCategory as any);
router.delete('/categories/:id', deleteCategory as any);
router.post('/categories/seed', seedCategories as any);

// Orders
router.get('/orders', getAdminOrders as any);
router.put('/orders/:id', updateOrderStatus as any);

// Products CRUD
router.get('/products', getAdminProducts as any);
router.post('/products', createProduct as any);
router.put('/products/:id', editProduct as any);
router.delete('/products/:id', deleteProduct as any);

// Image Upload
router.post('/upload', upload.single('image'), adminUploadProductImage as any);

// Coupons CRUD
router.get('/coupons', getAdminCoupons as any);
router.post('/coupons', createCoupon as any);
router.put('/coupons/:id', editCoupon as any);
router.delete('/coupons/:id', deleteCoupon as any);

// Customers
router.get('/customers', getAdminCustomers as any);

// Shipping Rules CRUD
router.get('/shipping-rules', getAdminShippingRules as any);
router.post('/shipping-rules', createShippingRule as any);
router.put('/shipping-rules/:id', editShippingRule as any);
router.delete('/shipping-rules/:id', deleteShippingRule as any);

export default router;

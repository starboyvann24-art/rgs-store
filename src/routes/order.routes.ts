import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getOrderStats,
  deliverOrder,
  confirmOrder,
  getWaitingOrders
} from '../controllers/order.controller';
import { validate } from '../middleware/validate.middleware';
import { createOrderSchema, updateOrderStatusSchema, deliverOrderSchema } from '../validations/order.validation';
import { verifyToken, isAdmin } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

// ============================================================
// RGS STORE — Order Routes v3.1
// ============================================================

const router: Router = Router();

// USER ROUTES (requires auth)
// POST /api/orders — Create new order
router.post('/', verifyToken, validate(createOrderSchema), createOrder);

// GET /api/orders/me — Get my orders
router.get('/me', verifyToken, getMyOrders);

// POST /api/orders/confirm — Confirm payment
router.post('/confirm', verifyToken, upload.single('payment_proof'), confirmOrder);

// ADMIN ROUTES (auth + admin role)
// GET /api/orders/stats/summary — Get order statistics
router.get('/stats/summary', verifyToken, isAdmin, getOrderStats);

// GET /api/orders — Get all orders (admin)
router.get('/', verifyToken, isAdmin, getAllOrders);

// GET /api/orders/admin/waiting — Get orders needing verification
router.get('/admin/waiting', verifyToken, isAdmin, getWaitingOrders);

// GET /api/orders/:id — Get single order (admin or owner)
router.get('/:id', verifyToken, getOrderById);

// PUT /api/orders/:id/status — Update order status (admin)
router.put('/:id/status', verifyToken, isAdmin, validate(updateOrderStatusSchema), updateOrderStatus);

// PUT /api/orders/:id/deliver — Ship order + set credentials (admin)
router.put('/:id/deliver', verifyToken, isAdmin, validate(deliverOrderSchema), deliverOrder);

export default router;

import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getOrderStats
} from '../controllers/order.controller';
import { validate } from '../middleware/validate.middleware';
import { createOrderSchema, updateOrderStatusSchema } from '../validations/order.validation';
import { verifyToken, isAdmin } from '../middleware/auth.middleware';

// ============================================================
// RGS STORE — Order Routes
// ============================================================

const router: Router = Router();

// USER ROUTES (requires auth)
// POST /api/v1/orders — Create new order
router.post('/', verifyToken, validate(createOrderSchema), createOrder);

// GET /api/v1/orders/me — Get my orders
router.get('/me', verifyToken, getMyOrders);

// ADMIN ROUTES (auth + admin role)
// GET /api/v1/orders/stats/summary — Get order statistics
router.get('/stats/summary', verifyToken, isAdmin, getOrderStats);

// GET /api/v1/orders — Get all orders (admin)
router.get('/', verifyToken, isAdmin, getAllOrders);

// GET /api/v1/orders/:id — Get single order (admin or owner)
router.get('/:id', verifyToken, getOrderById);

// PUT /api/v1/orders/:id/status — Update order status (admin)
router.put('/:id/status', verifyToken, isAdmin, validate(updateOrderStatusSchema), updateOrderStatus);

export default router;

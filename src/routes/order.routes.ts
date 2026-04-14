import { Router } from 'express';
import {
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getOrderStats,
  deliverOrder
} from '../controllers/order.controller';
import { validate } from '../middleware/validate.middleware';
import { createOrderSchema, updateOrderStatusSchema, deliverOrderSchema } from '../validations/order.validation';
import { verifyToken, isAdmin } from '../middleware/auth.middleware';

// ============================================================
// RGS STORE — Order Routes v3.1
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

// PUT /api/v1/orders/:id/deliver — Ship order + set credentials (admin)
router.put('/:id/deliver', verifyToken, isAdmin, validate(deliverOrderSchema), deliverOrder);

export default router;

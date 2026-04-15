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

// GET /api/orders/:id/invoice — Download PDF Invoice
router.get('/:id/invoice', verifyToken, async (req: any, res: any) => {
  try {
    const orderId = req.params.id;
    const userId = req.user.id;
    const role = req.user.role;
    const db2 = require('../config/database').default;

    const query = role === 'admin'
      ? 'SELECT * FROM orders WHERE id = ? LIMIT 1'
      : 'SELECT * FROM orders WHERE id = ? AND user_id = ? LIMIT 1';
    const params: any[] = role === 'admin' ? [orderId] : [orderId, userId];
    const [rows] = await db2.query(query, params);
    const order = rows[0];

    if (!order) { res.status(404).json({ success: false, message: 'Order not found' }); return; }

    const { generateInvoicePDF } = require('../utils/pdf');
    const pdfBuffer = await generateInvoicePDF({
      order_number: order.order_number,
      customer_name: order.user_name,
      customer_email: order.user_email,
      product_name: order.product_name,
      qty: order.qty,
      unit_price: order.unit_price,
      total_price: order.total_price,
      payment_method: order.payment_method,
      status: order.status,
      created_at: order.created_at
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Invoice-${order.order_number}.pdf"`,
      'Content-Length': pdfBuffer.length
    });
    res.send(pdfBuffer);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

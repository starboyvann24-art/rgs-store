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
// RGS STORE — Order Routes v3.1 (Relaxed Invoice Auth)
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

// GET /api/orders/:id/invoice — Download PDF Invoice (Relaxed Auth)
router.get('/:id/invoice', async (req: any, res: any) => {
  try {
    const orderId = req.params.id;
    const db2 = require('../config/database').default;
    const jwt = require('jsonwebtoken');

    // Optional Authentication
    let userId = null;
    let role = null;
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'rgs_super_secret_key_2026');
        userId = decoded.id;
        role = decoded.role;
      }
    } catch (e) { /* ignore invalid token, mode: public */ }

    const baseQuery = `
      SELECT 
        o.*,
        COALESCE(p.name, o.product_name) AS product_name_display,
        p.price AS product_original_price
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      WHERE o.id = ? LIMIT 1
    `;

    const [rows] = await db2.query(baseQuery, [orderId]);
    const order = rows[0];

    if (!order) {
      res.status(404).json({ success: false, message: 'Order tidak valid atau tidak ditemukan.' });
      return;
    }

    // Logic: ALLOW if ADMIN or OWNER or Status is SUCCESS/SHIPPED
    const isSuccess = order.status === 'success' || order.status === 'shipped';
    const isAdminUser = role === 'admin';
    const isOwner = (userId === order.user_id);

    if (!isAdminUser && !isOwner && !isSuccess) {
      res.status(403).json({ success: false, message: 'Akses Ditolak. Silakan login atau hubungi CS.' });
      return;
    }

    const { generateInvoicePDF } = require('../utils/pdf');
    const pdfBuffer = await generateInvoicePDF({
      order_number:   order.order_number,
      customer_name:  order.user_name,
      customer_email: order.user_email,
      product_name:   order.product_name_display || order.product_name || 'Produk Digital',
      qty:            order.qty,
      unit_price:     order.unit_price,
      total_price:    order.total_price,
      payment_method: order.payment_method,
      status:         order.status,
      created_at:     order.created_at
    });

    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="Invoice-RGS-${order.order_number}.pdf"`,
      'Content-Length':      pdfBuffer.length,
      'Cache-Control':       'no-cache'
    });
    res.send(pdfBuffer);
  } catch (err: any) {
    console.error('Invoice generation error:', err);
    res.status(500).json({ success: false, message: 'Gagal membuat invoice: ' + (err.message || 'Server error') });
  }
});

export default router;

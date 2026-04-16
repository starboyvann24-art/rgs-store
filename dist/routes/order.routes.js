"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const order_controller_1 = require("../controllers/order.controller");
const validate_middleware_1 = require("../middleware/validate.middleware");
const order_validation_1 = require("../validations/order.validation");
const auth_middleware_1 = require("../middleware/auth.middleware");
const upload_middleware_1 = require("../middleware/upload.middleware");
// ============================================================
// RGS STORE — Order Routes v3.1 (Relaxed Invoice Auth)
// ============================================================
const router = (0, express_1.Router)();
// USER ROUTES (requires auth)
// POST /api/orders — Create new order
router.post('/', auth_middleware_1.verifyToken, (0, validate_middleware_1.validate)(order_validation_1.createOrderSchema), order_controller_1.createOrder);
// GET /api/orders/me — Get my orders
router.get('/me', auth_middleware_1.verifyToken, order_controller_1.getMyOrders);
// POST /api/orders/confirm — Confirm payment
router.post('/confirm', auth_middleware_1.verifyToken, upload_middleware_1.upload.single('payment_proof'), order_controller_1.confirmOrder);
// ADMIN ROUTES (auth + admin role)
// GET /api/orders/stats/summary — Get order statistics
router.get('/stats/summary', auth_middleware_1.verifyToken, auth_middleware_1.isAdmin, order_controller_1.getOrderStats);
// GET /api/orders — Get all orders (admin)
router.get('/', auth_middleware_1.verifyToken, auth_middleware_1.isAdmin, order_controller_1.getAllOrders);
// GET /api/orders/admin/waiting — Get orders needing verification
router.get('/admin/waiting', auth_middleware_1.verifyToken, auth_middleware_1.isAdmin, order_controller_1.getWaitingOrders);
// GET /api/orders/:id — Get single order (admin or owner)
router.get('/:id', auth_middleware_1.verifyToken, order_controller_1.getOrderById);
// PUT /api/orders/:id/status — Update order status (admin)
router.put('/:id/status', auth_middleware_1.verifyToken, auth_middleware_1.isAdmin, (0, validate_middleware_1.validate)(order_validation_1.updateOrderStatusSchema), order_controller_1.updateOrderStatus);
// PUT /api/orders/:id/deliver — Ship order + set credentials (admin)
router.put('/:id/deliver', auth_middleware_1.verifyToken, auth_middleware_1.isAdmin, (0, validate_middleware_1.validate)(order_validation_1.deliverOrderSchema), order_controller_1.deliverOrder);
// GET /api/orders/:id/invoice — Download PDF Invoice (Relaxed Auth)
router.get('/:id/invoice', async (req, res) => {
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
        }
        catch (e) { /* ignore invalid token, mode: public */ }
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
            order_number: order.order_number,
            customer_name: order.user_name,
            customer_email: order.user_email,
            product_name: order.product_name_display || order.product_name || 'Produk Digital',
            qty: order.qty,
            unit_price: order.unit_price,
            total_price: order.total_price,
            payment_method: order.payment_method,
            status: order.status,
            created_at: order.created_at
        });
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="Invoice-RGS-${order.order_number}.pdf"`,
            'Content-Length': pdfBuffer.length,
            'Cache-Control': 'no-cache'
        });
        res.send(pdfBuffer);
    }
    catch (err) {
        console.error('Invoice generation error:', err);
        res.status(500).json({ success: false, message: 'Gagal membuat invoice: ' + (err.message || 'Server error') });
    }
});
exports.default = router;
//# sourceMappingURL=order.routes.js.map
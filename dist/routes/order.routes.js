"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const order_controller_1 = require("../controllers/order.controller");
const validate_middleware_1 = require("../middleware/validate.middleware");
const order_validation_1 = require("../validations/order.validation");
const auth_middleware_1 = require("../middleware/auth.middleware");
const upload_middleware_1 = require("../middleware/upload.middleware");
// ============================================================
// RGS STORE — Order Routes v3.1
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
// GET /api/orders/:id/invoice — Download PDF Invoice
router.get('/:id/invoice', auth_middleware_1.verifyToken, async (req, res) => {
    try {
        const orderId = req.params.id;
        const userId = req.user.id;
        const role = req.user.role;
        const db2 = require('../config/database').default;
        const query = role === 'admin'
            ? 'SELECT orders.*, products.name as product_name, products.price as original_product_price FROM orders JOIN products ON orders.product_id = products.id WHERE orders.id = ? LIMIT 1'
            : 'SELECT orders.*, products.name as product_name, products.price as original_product_price FROM orders JOIN products ON orders.product_id = products.id WHERE orders.id = ? AND orders.user_id = ? LIMIT 1';
        const params = role === 'admin' ? [orderId] : [orderId, userId];
        const [rows] = await db2.query(query, params);
        const order = rows[0];
        if (!order) {
            res.status(404).json({ success: false, message: 'Order not found' });
            return;
        }
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
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=order.routes.js.map
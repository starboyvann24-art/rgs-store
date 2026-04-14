"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const order_controller_1 = require("../controllers/order.controller");
const validate_middleware_1 = require("../middleware/validate.middleware");
const order_validation_1 = require("../validations/order.validation");
const auth_middleware_1 = require("../middleware/auth.middleware");
// ============================================================
// RGS STORE — Order Routes v3.1
// ============================================================
const router = (0, express_1.Router)();
// USER ROUTES (requires auth)
// POST /api/orders — Create new order
router.post('/', auth_middleware_1.verifyToken, (0, validate_middleware_1.validate)(order_validation_1.createOrderSchema), order_controller_1.createOrder);
// GET /api/orders/me — Get my orders
router.get('/me', auth_middleware_1.verifyToken, order_controller_1.getMyOrders);
// ADMIN ROUTES (auth + admin role)
// GET /api/orders/stats/summary — Get order statistics
router.get('/stats/summary', auth_middleware_1.verifyToken, auth_middleware_1.isAdmin, order_controller_1.getOrderStats);
// GET /api/orders — Get all orders (admin)
router.get('/', auth_middleware_1.verifyToken, auth_middleware_1.isAdmin, order_controller_1.getAllOrders);
// GET /api/orders/:id — Get single order (admin or owner)
router.get('/:id', auth_middleware_1.verifyToken, order_controller_1.getOrderById);
// PUT /api/orders/:id/status — Update order status (admin)
router.put('/:id/status', auth_middleware_1.verifyToken, auth_middleware_1.isAdmin, (0, validate_middleware_1.validate)(order_validation_1.updateOrderStatusSchema), order_controller_1.updateOrderStatus);
// PUT /api/orders/:id/deliver — Ship order + set credentials (admin)
router.put('/:id/deliver', auth_middleware_1.verifyToken, auth_middleware_1.isAdmin, (0, validate_middleware_1.validate)(order_validation_1.deliverOrderSchema), order_controller_1.deliverOrder);
exports.default = router;
//# sourceMappingURL=order.routes.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const order_controller_1 = require("../controllers/order.controller");
const validate_middleware_1 = require("../middleware/validate.middleware");
const order_validation_1 = require("../validations/order.validation");
const auth_middleware_1 = require("../middleware/auth.middleware");
// ============================================================
// RGS STORE — Order Routes
// ============================================================
const router = (0, express_1.Router)();
// USER ROUTES (requires auth)
// POST /api/v1/orders — Create new order
router.post('/', auth_middleware_1.verifyToken, (0, validate_middleware_1.validate)(order_validation_1.createOrderSchema), order_controller_1.createOrder);
// GET /api/v1/orders/me — Get my orders
router.get('/me', auth_middleware_1.verifyToken, order_controller_1.getMyOrders);
// ADMIN ROUTES (auth + admin role)
// GET /api/v1/orders/stats/summary — Get order statistics
router.get('/stats/summary', auth_middleware_1.verifyToken, auth_middleware_1.isAdmin, order_controller_1.getOrderStats);
// GET /api/v1/orders — Get all orders (admin)
router.get('/', auth_middleware_1.verifyToken, auth_middleware_1.isAdmin, order_controller_1.getAllOrders);
// GET /api/v1/orders/:id — Get single order (admin or owner)
router.get('/:id', auth_middleware_1.verifyToken, order_controller_1.getOrderById);
// PUT /api/v1/orders/:id/status — Update order status (admin)
router.put('/:id/status', auth_middleware_1.verifyToken, auth_middleware_1.isAdmin, (0, validate_middleware_1.validate)(order_validation_1.updateOrderStatusSchema), order_controller_1.updateOrderStatus);
exports.default = router;
//# sourceMappingURL=order.routes.js.map
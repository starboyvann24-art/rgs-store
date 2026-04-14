"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_controller_1 = require("../controllers/payment.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
// ============================================================
// RGS STORE — Payment Method Routes
// ============================================================
const router = (0, express_1.Router)();
// GET /api/v1/payment-methods — Get active methods (public)
router.get('/', payment_controller_1.getPaymentMethods);
// GET /api/v1/payment-methods/all — Get all methods (admin)
router.get('/all', auth_middleware_1.verifyToken, auth_middleware_1.isAdmin, payment_controller_1.getAllPaymentMethods);
// POST /api/v1/payment-methods — Create method (admin)
router.post('/', auth_middleware_1.verifyToken, auth_middleware_1.isAdmin, payment_controller_1.createPaymentMethod);
// PUT /api/v1/payment-methods/:id — Update method (admin)
router.put('/:id', auth_middleware_1.verifyToken, auth_middleware_1.isAdmin, payment_controller_1.updatePaymentMethod);
// DELETE /api/v1/payment-methods/:id — Delete method (admin)
router.delete('/:id', auth_middleware_1.verifyToken, auth_middleware_1.isAdmin, payment_controller_1.deletePaymentMethod);
exports.default = router;
//# sourceMappingURL=payment.routes.js.map
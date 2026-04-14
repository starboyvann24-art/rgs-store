"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const review_controller_1 = require("../controllers/review.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
// ============================================================
// RGS STORE — Review Routes
// ============================================================
const router = (0, express_1.Router)();
// POST /api/reviews — Create review for completed order (user)
router.post('/', auth_middleware_1.verifyToken, review_controller_1.createReview);
// GET /api/reviews/product/:productId — Get product reviews (public)
router.get('/product/:productId', review_controller_1.getProductReviews);
exports.default = router;
//# sourceMappingURL=review.routes.js.map
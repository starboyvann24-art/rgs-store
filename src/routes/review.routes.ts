import { Router } from 'express';
import { createReview, getProductReviews } from '../controllers/review.controller';
import { verifyToken } from '../middleware/auth.middleware';

// ============================================================
// RGS STORE — Review Routes
// ============================================================

const router: Router = Router();

// POST /api/v1/reviews — Create review for completed order (user)
router.post('/', verifyToken, createReview);

// GET /api/v1/reviews/product/:productId — Get product reviews (public)
router.get('/product/:productId', getProductReviews);

export default router;

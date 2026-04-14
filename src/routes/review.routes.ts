import { Router } from 'express';
import { createReview, getProductReviews } from '../controllers/review.controller';
import { verifyToken } from '../middleware/auth.middleware';

// ============================================================
// RGS STORE — Review Routes
// ============================================================

const router: Router = Router();

// POST /api/reviews — Create review for completed order (user)
router.post('/', verifyToken, createReview);

// GET /api/reviews/product/:productId — Get product reviews (public)
router.get('/product/:productId', getProductReviews);

export default router;

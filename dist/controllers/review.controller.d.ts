import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
/**
 * POST /api/v1/reviews
 * Create a review for a completed order (user)
 */
export declare const createReview: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * GET /api/v1/reviews/product/:productId
 * Get all reviews for a specific product (public)
 */
export declare const getProductReviews: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=review.controller.d.ts.map
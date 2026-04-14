import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
/**
 * GET /api/v1/payment-methods
 * Get all active payment methods (public)
 */
export declare const getPaymentMethods: (_req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * GET /api/v1/payment-methods/all
 * Get all payment methods including inactive (admin)
 */
export declare const getAllPaymentMethods: (_req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * POST /api/v1/payment-methods
 * Create a new payment method (admin)
 */
export declare const createPaymentMethod: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * PUT /api/v1/payment-methods/:id
 * Update a payment method (admin)
 */
export declare const updatePaymentMethod: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * DELETE /api/v1/payment-methods/:id
 * Delete a payment method (admin)
 */
export declare const deletePaymentMethod: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=payment.controller.d.ts.map
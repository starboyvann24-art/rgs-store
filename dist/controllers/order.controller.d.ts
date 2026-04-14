import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
/**
 * POST /api/v1/orders
 * Create a new order (requires auth)
 */
export declare const createOrder: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * GET /api/v1/orders/me
 * Get orders for the current logged-in user
 */
export declare const getMyOrders: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * GET /api/v1/orders
 * Get all orders (admin only)
 */
export declare const getAllOrders: (_req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * GET /api/v1/orders/:id
 * Get single order by ID (admin or order owner)
 */
export declare const getOrderById: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * PUT /api/v1/orders/:id/status
 * Update order status (admin only)
 */
export declare const updateOrderStatus: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * PUT /api/v1/orders/:id/deliver
 * Set order status to 'shipped' and store credentials (admin only)
 */
export declare const deliverOrder: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * GET /api/v1/orders/stats/summary
 * Get order statistics (admin only)
 */
export declare const getOrderStats: (_req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=order.controller.d.ts.map
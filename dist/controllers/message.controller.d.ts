import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
/**
 * POST /api/v1/messages
 * Send a message (User or Admin)
 */
export declare const sendMessage: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * GET /api/v1/messages
 * Get current user's messages (Public/User)
 */
export declare const getMyMessages: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * GET /api/v1/messages/users
 * Get list of users who have chatted (Admin only)
 */
export declare const getChatUsers: (_req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
/**
 * GET /api/v1/messages/user/:id
 * Get specific user's chat history (Admin only)
 */
export declare const getUserMessages: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=message.controller.d.ts.map
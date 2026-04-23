import { Request, Response, NextFunction } from 'express';
/**
 * GET /api/v1/auth/me
 * Get current logged-in user profile (requires auth token)
 */
export declare const getMe: (req: any, res: Response, next: NextFunction) => Promise<void>;
/**
 * PUT /api/v1/auth/profile
 * Update user profile (name, whatsapp, avatar)
 */
export declare const updateProfile: (req: any, res: Response, next: NextFunction) => Promise<void>;
/**
 * GET /api/auth/logout
 * Flawless Logout
 */
export declare const logout: (req: Request, res: Response, _next: NextFunction) => void;
//# sourceMappingURL=auth.controller.d.ts.map
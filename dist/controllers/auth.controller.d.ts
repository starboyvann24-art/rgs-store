import { Request, Response, NextFunction } from 'express';
/**
 * POST /api/v1/auth/register
 * Register a new user account
 */
export declare const register: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * POST /api/v1/auth/login
 * Login with email and password
 */
export declare const login: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * GET /api/v1/auth/me
 * Get current logged-in user profile (requires auth token)
 */
export declare const getMe: (req: any, res: Response, next: NextFunction) => Promise<void>;
/**
 * POST /api/v1/auth/forgot-password
 * Request a password reset link
 */
export declare const forgotPassword: (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * POST /api/v1/auth/reset-password
 * Reset password using token
 */
export declare const resetPassword: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.controller.d.ts.map
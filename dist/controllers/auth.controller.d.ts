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
/**
 * PUT /api/v1/auth/profile
 * Update user profile (name, whatsapp, avatar)
 */
export declare const updateProfile: (req: any, res: Response, next: NextFunction) => Promise<void>;
/**
 * GET /api/auth/google/callback
 * Google OAuth callback — DB upsert + JWT issue + redirect to login.html
 *
 * Flow:
 *   1. Google redirects here with profile in req.user (set by Passport)
 *   2. We upsert the user in MySQL (create or link google_id)
 *   3. Issue a JWT token
 *   4. Redirect to /login.html?google_token=TOKEN&role=ROLE
 *   5. login.html JS saves the token to localStorage and navigates to app
 */
export declare const googleCallback: (req: any, res: Response, _next: NextFunction) => Promise<void>;
/**
 * GET /api/auth/logout
 * Flawless Logout
 */
export declare const logout: (req: Request, res: Response, _next: NextFunction) => void;
//# sourceMappingURL=auth.controller.d.ts.map
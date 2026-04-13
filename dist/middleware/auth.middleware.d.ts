import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from '../utils/jwt';
export interface AuthRequest extends Request {
    user?: JwtPayload;
}
/**
 * Verifies JWT token from Authorization header (Bearer <token>)
 * Attaches decoded user data to req.user
 */
export declare const verifyToken: (req: AuthRequest, res: Response, next: NextFunction) => void;
/**
 * Checks if the authenticated user has admin role
 * Must be used AFTER verifyToken middleware
 */
export declare const isAdmin: (req: AuthRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.middleware.d.ts.map